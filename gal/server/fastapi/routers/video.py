from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from core.db import fs_videos

router = APIRouter(
    prefix="/video",
    tags=["Video Streaming"],
)

def iterfile(grid_out, chunk_size=1024 * 1024):
    while True:
        chunk = grid_out.read(chunk_size)
        if not chunk:
            break
        yield chunk

@router.get("/{file_id}")
def stream_video(file_id: str):
    try:
        grid_out = fs_videos.get(ObjectId(file_id))
        return StreamingResponse(
            iterfile(grid_out),
            media_type=grid_out.content_type or "video/mp4",
        )
    except Exception:
        raise HTTPException(status_code=404, detail="파일이 없거나 잘못된 ID입니다.")