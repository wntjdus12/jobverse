import os
import re
import base64
import asyncio
import markdown
from functools import lru_cache

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

from pymongo import MongoClient
from bson import ObjectId
import gridfs


# --- 환경설정 ---
load_dotenv()
GITHUB_API_URL = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- FastAPI 설정 ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MongoDB / GridFS 설정 ---
mongo_client = MongoClient("mongodb://admin:admin123@3.39.202.109:27017/job?authSource=admin")
mongo_db = mongo_client["job"]  # 기존 회원정보도 들어있는 job DB 그대로 사용
fs = gridfs.GridFS(mongo_db, collection="videos")  # 버킷명 videos → videos.files / videos.chunks 생성

def iterfile(grid_out, chunk_size=1024 * 1024):
    while True:
        chunk = grid_out.read(chunk_size)
        if not chunk:
            break
        yield chunk

@app.get("/video/{file_id}")
def stream_video(file_id: str):
    try:
        grid_out = fs.get(ObjectId(file_id))
        return StreamingResponse(
            iterfile(grid_out),
            media_type=grid_out.content_type or "video/mp4",
        )
    except Exception:
        raise HTTPException(status_code=404, detail="파일이 없거나 잘못된 ID입니다.")

# --- GitHub / OpenAI 관련 ---
def github_headers():
    return {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

@app.get("/repos/{username}")
async def get_repos(username: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API_URL}/users/{username}/repos", headers=github_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch repos")
        return resp.json()

@app.get("/repos/{username}/{repo}/languages")
async def get_languages(username: str, repo: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API_URL}/repos/{username}/{repo}/languages", headers=github_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch languages")
        return resp.json()

@app.get("/repos/{username}/{repo}/readme")
async def get_readme(username: str, repo: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API_URL}/repos/{username}/{repo}/readme", headers=github_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch readme")
        data = resp.json()
        content = data.get("content")
        if content:
            decoded_markdown = base64.b64decode(content).decode('utf-8', errors="replace")
            html = markdown.markdown(decoded_markdown, extensions=['fenced_code', 'tables', 'toc', 'nl2br'])
            return {"readme_html": html, "readme_markdown": decoded_markdown}
        return {"readme_html": "", "readme_markdown": ""}

@app.get("/repos/{owner}/{repo}/contributions/{username}")
async def get_repo_contribution(owner: str, repo: str, username: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GITHUB_API_URL}/repos/{owner}/{repo}/contributors", headers=github_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch contributors")
        data = resp.json()
        total = sum(c["contributions"] for c in data)
        user_commit = next((c["contributions"] for c in data if c["login"].lower() == username.lower()), 0)
        percent = (user_commit / total * 100) if total else 0
        return {
            "my_commit": user_commit,
            "total_commit": total,
            "contribution_percent": round(percent, 1)
        }

# --- 요약 관련 모델 및 함수 ---
class SummaryRequest(BaseModel):
    readme: str
    github_url: str = ""

class ReposSummaryRequest(BaseModel):
    repos: list[SummaryRequest]

def remove_images_from_markdown(text: str) -> str:
    text = re.sub(r'!\[[^\]]*\]\([^)]+\)', '', text)
    text = re.sub(r'<img\s[^>]*>', '', text, flags=re.IGNORECASE | re.MULTILINE)
    return text

@lru_cache(maxsize=256)
def prompt_to_key(prompt: str) -> str:
    return prompt

async def call_openai_api(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400,
        "temperature": 0.5,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, json=body)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()

@app.post("/openai-summary/")
async def get_summary(payload: SummaryRequest):
    readme = payload.readme or ""
    github_url = payload.github_url or ""

    lines = [line.strip() for line in readme.strip().splitlines() if line.strip()]
    total_length = sum(len(line) for line in lines)
    if not readme.strip() or (len(lines) <= 2 and total_length < 100) or (all(line.startswith("#") for line in lines) and len(lines) <= 2):
        return {"summary": "리드미에 내용이 없습니다."}

    prompt = f"""
아래는 GitHub 저장소의 README.md 내용입니다.
이 내용을 요약해서 포트폴리오에 어울리는 ‘간단 설명’과 ‘주요 기능(3~5개 불릿포인트)’만 마크다운으로 정리해 주세요.

- **이미지(마크다운 이미지 구문, <img ...> HTML 등)는 절대 포함하지 마세요.**
- 제목, 기술스택(태그), 깃허브 링크 등은 절대 넣지 마세요.
- 불필요한 텍스트 없이, 핵심 기능과 설명 위주로만 작성해주세요.

마지막 줄에 아래 주소를 마크다운 링크 형식으로 포함하세요:  
[GitHub 레포지토리]({github_url})

아래는 README.md 원문입니다:

{readme[:2000]}
"""
    cache_key = prompt_to_key(prompt)
    if not hasattr(app.state, "summary_cache"):
        app.state.summary_cache = {}
    cache = app.state.summary_cache
    if cache_key in cache:
        return {"summary": cache[cache_key]}
    try:
        summary = await call_openai_api(prompt)
        summary = remove_images_from_markdown(summary)
        cache[cache_key] = summary
        return {"summary": summary}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"summary": f"오류 발생: {str(e)}"},
        )

@app.post("/openai-summaries/")
async def get_summaries(payload: ReposSummaryRequest):
    tasks = []
    for repo_data in payload.repos:
        readme = repo_data.readme or ""
        github_url = repo_data.github_url or ""

        lines = [line.strip() for line in readme.strip().splitlines() if line.strip()]
        total_length = sum(len(line) for line in lines)
        if not readme.strip() or (len(lines) <= 2 and total_length < 100) or (all(line.startswith("#") for line in lines) and len(lines) <= 2):
            tasks.append(asyncio.sleep(0, result="리드미에 내용이 없습니다."))
            continue

        prompt = f"""
아래는 GitHub 저장소의 README.md 내용입니다.
이 내용을 요약해서 포트폴리오에 어울리는 ‘간단 설명’과 ‘주요 기능(3~5개 불릿포인트)’만 마크다운으로 정리해 주세요.

- **이미지(마크다운 이미지 구문, <img ...> HTML 등)는 절대 포함하지 마세요.**
- 제목, 기술스택(태그), 깃허브 링크 등은 절대 넣지 마세요.
- 불필요한 텍스트 없이, 핵심 기능 위주로만 작성해 주세요.

마지막 줄에 아래 주소를 마크다운 링크 형식으로 포함하세요:  
[GitHub 레포지토리]({github_url})

아래는 README.md 원문입니다:

{readme[:2000]}
"""
        cache_key = prompt_to_key(prompt)
        if not hasattr(app.state, "summary_cache"):
            app.state.summary_cache = {}
        cache = app.state.summary_cache
        if cache_key in cache:
            tasks.append(asyncio.sleep(0, result=cache[cache_key]))
        else:
            tasks.append(call_openai_api(prompt))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for idx, result in enumerate(results):
        if not isinstance(result, Exception):
            cleaned = remove_images_from_markdown(result)
            prompt = prompt_to_key(payload.repos[idx].readme[:2000])
            cache[prompt] = cleaned

    return {
        "summaries": [
            remove_images_from_markdown(r) if not isinstance(r, Exception) else f"오류 발생: {r}"
            for r in results
        ]
    }
