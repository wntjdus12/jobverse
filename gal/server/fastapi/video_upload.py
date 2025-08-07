from fastapi.responses import StreamingResponse
from pymongo import MongoClient

from bson import ObjectId
from pymongo import MongoClient
import gridfs



client = MongoClient("mongodb://13.125.60.100:27017/")
db = client["jobdescription"]       

fs = gridfs.GridFS(db)   

file_path = "../assets/backend_jobdescription.mp4"

with open(file_path, "rb") as f:
    file_id = fs.put(f, filename="backend.mp4", content_type="video/mp4")

print(f"파일 업로드 완료! 파일 ID: {file_id}")