import os
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
from pymongo import MongoClient

from bson import ObjectId
from pymongo import MongoClient
import gridfs

load_dotenv()

# ✅ .env 파일에서 MONGO_URI 변수 읽기
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["job"]       

fs = gridfs.GridFS(db, collection="videos")   

file_path = "./assets/backend.mp4"

with open(file_path, "rb") as f:
    file_id = fs.put(f, filename="backend.mp4", content_type="video/mp4")

print(f"파일 업로드 완료! 파일 ID: {file_id}")