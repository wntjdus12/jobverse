from pymongo import MongoClient
import gridfs
import os

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client["job"]

# GridFS 인스턴스 (비디오용)
fs_videos = gridfs.GridFS(mongo_db, collection="videos")