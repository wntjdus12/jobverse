import os
import time
from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Body, Depends, Query
from bson import ObjectId
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
import httpx

from core.db import mongo_db
from models import MetacognitionAnswers, MetacognitionScores, AnalysisResponse
from data.metacognition_weights import WEIGHTS, CATEGORIES  # ✅ 공식 가중치/카테고리

router = APIRouter(prefix="/metacognition", tags=["Metacognition Test"])

# ---------- JWT ----------
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    JWT 토큰에서 사용자 ObjectId 문자열 추출({_id}).
    """
    if not SECRET_KEY:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY is not set on the server.")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        try:
            _ = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid user id in token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# ---------- 점수 계산 (정수 가중치 누적) ----------
def compute_scores(answers: Dict[str, str]) -> Dict[str, int]:
    scores = {k: 0 for k in CATEGORIES}
    for qid_str, choice_key in answers.items():
        try:
            qid = int(qid_str)
        except ValueError:
            continue
        deltas = WEIGHTS.get(qid, {}).get(choice_key, {})
        for cat, inc in deltas.items():
            if cat in scores:
                scores[cat] += int(inc)
    return scores

# ---------- OpenAI 설정 ----------
AI_ENABLED = os.getenv("AI_ANALYSIS_ENABLED", "true").lower() in ("1", "true", "yes")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ENV로도 제어 가능: 비어있거나 "none"이면 무제한 대기
_env_timeout = os.getenv("AI_TIMEOUT_SECONDS", "").strip().lower()
if _env_timeout in ("", "none"):
    AI_TIMEOUT_DEFAULT: Optional[float] = None  # ← 기본 무제한
else:
    try:
        AI_TIMEOUT_DEFAULT = float(_env_timeout)
    except Exception:
        AI_TIMEOUT_DEFAULT = None  # 파싱 실패 시 무제한

def build_prompt(scores: Dict[str, int]) -> str:
    pretty = "\n".join([f"- {k}: {v}" for k, v in scores.items()])
    return f"""
아래는 사용자의 역량 프로필 점수입니다(정수 누적 방식):
{pretty}

원하는 출력:
1) 강점 2가지 (한 줄씩)
2) 보완할 점 1가지 (한 줄)
3) 다음 액션 3가지 (구체적, 측정 가능)

톤 & 형식:
- 실무 코칭 톤, 간결
- 각 항목은 불릿 없이 문장 1줄
""".strip()

def fallback_advice(scores: Dict[str, int]) -> str:
    if not scores:
        return "아직 점수가 계산되지 않았습니다."
    top = max(scores.items(), key=lambda x: x[1])[0]
    tips = {
        "result_oriented": "결과 중심성이 강점이에요. 과정 점검을 병행해 리스크를 낮추면 더 탄탄해집니다.",
        "process_oriented": "과정/논리가 탄탄해요. 실행 속도를 높이기 위한 최소 실험을 병행해 보세요.",
        "ownership": "주도성이 뛰어나요. 위임과 공유를 통해 팀 전체 성과를 끌어올려 보세요.",
        "collaboration": "소통/협업이 강점이에요. 의사결정 기록을 남겨 재현성을 높여보세요.",
        "user_centric": "고객/기업 이해가 강합니다. 정성/정량 지표를 함께 관리하면 더 빨라집니다.",
    }
    base = tips.get(top, "강점을 바탕으로 부족한 영역을 1개 골라 실험적으로 보완해 보세요.")
    return f"{base}\n(모델 응답이 지연되거나 실패하여 기본 코멘트를 표시했습니다.)"

async def try_llm_advice(
    scores: Dict[str, int],
    answers: Dict[str, str],
    timeout_seconds: Optional[float],
) -> Optional[str]:
    """
    OpenAI 호출만 수행. 실패/예외 시 None 반환.
    timeout_seconds=None이면 httpx 타임아웃 해제(무제한 대기).
    """
    if not (AI_ENABLED and OPENAI_API_KEY):
        return None

    prompt = build_prompt(scores)
    client_timeout = None if timeout_seconds is None else timeout_seconds

    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=client_timeout) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": AI_MODEL,
                    "messages": [
                        {"role": "system", "content": "당신은 경력 코치이자 채용 컨설턴트입니다."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 512,
                },
            )
        resp.raise_for_status()
        elapsed = time.perf_counter() - t0
        data = resp.json()
        advice = data["choices"][0]["message"]["content"].strip()
        # 참고: 필요 시 elapsed를 로그/메타에 저장 가능
        return advice
    except Exception:
        return None  # 타임아웃/네트워크/HTTP 에러 등

# 사용자별 1개 문서만 유지되도록 unique 인덱스
try:
    mongo_db.metacognition_results.create_index("user_id", unique=True)
except Exception:
    pass

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_metacognition(
    payload: MetacognitionAnswers = Body(...),
    current_user_id: str = Depends(get_current_user_id),
    # 쿼리로 요청별 타임아웃 제어: 기본 None(무제한 대기)
    timeout_seconds: Optional[float] = Query(
        default=AI_TIMEOUT_DEFAULT,
        description="OpenAI 호출 타임아웃(초). 비우거나 'none'이면 무제한 대기.",
    ),
):
    # 1) 점수 계산 (정수 가중치 누적)
    scores_dict = compute_scores(payload.answers)

    # 2) AI 분석 — 기본은 무제한 대기. 에러나 예외 시 폴백.
    ai_advice = await try_llm_advice(scores_dict, payload.answers, timeout_seconds)
    if not ai_advice:
        ai_advice = fallback_advice(scores_dict)

    # 3) upsert: 같은 사용자 결과는 갱신
    now = datetime.utcnow()
    mongo_db.metacognition_results.update_one(
        {"user_id": ObjectId(current_user_id)},
        {
            "$set": {
                "scores": scores_dict,
                "ai_advice": ai_advice,
                "updated_at": now,
                "ai_meta": {
                    "model": AI_MODEL if (ai_advice and AI_ENABLED) else "fallback",
                    "ai_enabled": AI_ENABLED,
                    "timeout_seconds": timeout_seconds,  # None이면 무제한
                },
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    # 4) 응답
    return AnalysisResponse(
        scores=MetacognitionScores(**scores_dict),
        ai_advice=ai_advice,
    )
