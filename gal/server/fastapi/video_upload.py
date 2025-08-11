from fastapi.responses import StreamingResponse
from pymongo import MongoClient

from bson import ObjectId
from pymongo import MongoClient
import gridfs



client = MongoClient("mongodb://admin:admin123@3.39.202.109:27017/job?authSource=admin")
db = client["job"]       

fs = gridfs.GridFS(db, collection="videos")   

file_path = "./assets/backend.mp4"

with open(file_path, "rb") as f:
    file_id = fs.put(f, filename="backend.mp4", content_type="video/mp4")

print(f"파일 업로드 완료! 파일 ID: {file_id}")