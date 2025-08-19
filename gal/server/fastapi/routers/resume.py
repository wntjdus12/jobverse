from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pymongo import MongoClient, ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from jose import jwt, JWTError
from collections import Counter
import os
from dotenv import load_dotenv
from typing import Dict, Any, List

load_dotenv()

router = APIRouter(prefix="/resume", tags=["resume"])

# === Env / DB ===
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError(".env에 MONGO_URI가 없습니다.")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError(".env에 JWT_SECRET_KEY(또는 SECRET_KEY)이 없습니다.")
JWT_ALG = os.getenv("JWT_ALGORITHM", "HS256")

client = MongoClient(MONGO_URI)
db = client.get_default_database()  # ex) mongodb://localhost:27017/mydb

# === 직렬화 인코더 ===
CUSTOM_ENCODERS = {
    ObjectId: str,
    datetime: lambda dt: dt.isoformat(),
}

# === 유틸: 토큰에서 user_id 꺼내기 ===
def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 없습니다.")
    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALG])
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    user_id = payload.get("_id") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="토큰에 사용자 식별자가 없습니다.")
    return user_id

# === 유틸: user 필드로 프로필 조회 ===
def find_profile_by_user_id(user_id: str, include_photo: bool = True) -> dict | None:
    projections = None if include_photo else {"photo": 0}
    try:
        query = {"user": ObjectId(user_id)}
        doc = db["profiles"].find_one(query, projections)
    except InvalidId:
        doc = None
    if not doc:
        doc = db["profiles"].find_one({"user": user_id}, projections)
    return doc

# === (기존) 전체 user OID 나열 ===
@router.get("/users")
def get_profile_users():
    try:
        cursor = db["profiles"].find({}, {"user": 1, "_id": 0})
        user_ids = []
        for doc in cursor:
            u = doc.get("user")
            if isinstance(u, ObjectId):
                user_ids.append(str(u))
            elif isinstance(u, str):
                user_ids.append(u)
            elif isinstance(u, dict) and "$oid" in u:
                user_ids.append(u["$oid"])
        payload = jsonable_encoder({"users": user_ids}, custom_encoder=CUSTOM_ENCODERS)
        return JSONResponse(content=payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 핵심: 로그인 사용자 프로필 ===
@router.get("/me")
def get_my_profile(
    request: Request,
    include_photo: bool = Query(True, description="사진(base64) 포함 여부")
):
    user_id = get_current_user_id(request)
    try:
        doc = find_profile_by_user_id(user_id, include_photo=include_photo)
        if not doc:
            raise HTTPException(status_code=404, detail="프로필이 존재하지 않습니다.")
        payload = jsonable_encoder({"profile": doc}, custom_encoder=CUSTOM_ENCODERS)
        return JSONResponse(content=payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 참고: 특정 user_id로 직접 조회 ===
@router.get("/profiles/{user_id}")
def get_profile_by_user(user_id: str, include_photo: bool = Query(True)):
    try:
        doc = find_profile_by_user_id(user_id, include_photo=include_photo)
        if not doc:
            raise HTTPException(status_code=404, detail="해당 user의 profile을 찾을 수 없습니다.")
        payload = jsonable_encoder({"profile": doc}, custom_encoder=CUSTOM_ENCODERS)
        return JSONResponse(content=payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ===============  제출 & 통계: /resume/submit  ===============
# ============================================================

def _to_object_id_maybe(s: str):
    try:
        return ObjectId(s)
    except Exception:
        return s  # 문자열로 저장된 DB도 대비

def _safe_str(x: Any) -> str:
    if x is None:
        return ""
    return str(x).strip()

def _counter_to_list(counter: Counter, top_k: int | None = None) -> List[Dict[str, Any]]:
    items = counter.most_common(top_k) if top_k else counter.most_common()
    return [{"name": k, "count": v} for k, v in items if _safe_str(k)]

def _collect_stats_from_profiles(profiles: List[Dict[str, Any]]) -> Dict[str, Any]:

    certs = Counter()
    activities_by_title = Counter()
    awards_by_title = Counter()
    majors = Counter()
    schools = Counter()
    levels = Counter()

    # 횟수 분포용
    activities_count_dist = Counter()
    awards_count_dist = Counter()
    per_user_activities_count: List[int] = []
    per_user_awards_count: List[int] = []

    for p in profiles:
        # certificates: ["정보처리기사", ...]
        for c in (p.get("certificates") or []):
            certs[_safe_str(c)] += 1

        # activities: [{title, content}]
        acts = p.get("activities") or []
        acts_len = len(acts)
        per_user_activities_count.append(acts_len)
        if acts_len > 0:
            # 10회 초과는 11 버킷(= 10회+)로 합산
            bucket = acts_len if acts_len <= 10 else 11
            activities_count_dist[bucket] += 1
        for a in acts:
            title = _safe_str(a.get("title"))
            if title:
                activities_by_title[title] += 1

        # awards: [{title, content}]
        awds = p.get("awards") or []
        awds_len = len(awds)
        per_user_awards_count.append(awds_len)
        if awds_len > 0:
            bucket = awds_len if awds_len <= 10 else 11
            awards_count_dist[bucket] += 1
        for a in awds:
            title = _safe_str(a.get("title"))
            if title:
                awards_by_title[title] += 1

        # education: [{level, status, school, major}]
        for e in (p.get("education") or []):
            m = _safe_str(e.get("major"))
            s = _safe_str(e.get("school"))
            l = _safe_str(e.get("level"))
            if m:
                majors[m] += 1
            if s:
                schools[s] += 1
            if l:
                levels[l] += 1

    return {
        # (유지) 항목명 분포
        "certificates": _counter_to_list(certs),
        "activities": _counter_to_list(activities_by_title),
        "awards": _counter_to_list(awards_by_title),
        "majors": _counter_to_list(majors),
        "schools": _counter_to_list(schools),
        "levels": _counter_to_list(levels),

        # ✅ (추가) 사람당 '횟수' 분포
        #  키 1..10, 11(=10회+) 형태. 문자열 키여도 상관없지만 일관성을 위해 int로 둡니다.
        "activitiesCountDist": dict(activities_count_dist),
        "awardsCountDist": dict(awards_count_dist),

        # (선택) 유저별 횟수 배열 (원하면 프론트에서 직접 히스토그램 만들 때 사용)
        "perUser": {
            "activitiesCount": per_user_activities_count,
            "awardsCount": per_user_awards_count,
        },
    }

@router.put("/submit")
def submit_and_get_stats(request: Request, body: Dict[str, Any]):

    user_id = get_current_user_id(request)

    # --- 1) 저장(업서트) ---
    job_title = _safe_str(body.get("jobTitle") or body.get("role"))
    if not job_title:
        raise HTTPException(status_code=400, detail="jobTitle은 필수입니다.")

    doc_update = {
        "user": _to_object_id_maybe(user_id),
        "jobTitle": job_title,
        "activities": body.get("activities") or [],
        "awards": body.get("awards") or [],
        "certificates": body.get("certificates") or [],
        "education": body.get("education") or [],
        "email": _safe_str(body.get("email")),
        "phone": _safe_str(body.get("phone")),
        "photo": body.get("photo") or body.get("avatar") or "",
        "updatedAt": datetime.utcnow(),
    }
    existing = find_profile_by_user_id(user_id, include_photo=True)
    if not existing:
        doc_update["createdAt"] = datetime.utcnow()

    # user가 ObjectId/문자열 모두 업서트 보장
    query_obj = [{"user": _to_object_id_maybe(user_id)}, {"user": user_id}]
    updated = None
    for q in query_obj:
        updated = db["profiles"].find_one_and_update(
            q,
            {"$set": doc_update},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        if updated:
            break
    if not updated:
        updated = find_profile_by_user_id(user_id, include_photo=False)

    # --- 2) 통계 계산 (같은 jobTitle, 본인 제외) ---
    cursor = db["profiles"].find({"jobTitle": job_title})
    peers: List[Dict[str, Any]] = []
    for p in cursor:
        u = p.get("user")
        uid_str = str(u) if not isinstance(u, dict) else u.get("$oid", "")
        if uid_str == user_id:
            continue
        peers.append(p)

    stats = _collect_stats_from_profiles(peers)

    payload = jsonable_encoder(
        {
            "ok": True,
            "jobTitle": job_title,
            "sampleSize": len(peers),
            "stats": stats,
        },
        custom_encoder=CUSTOM_ENCODERS,
    )
    return JSONResponse(content=payload)
