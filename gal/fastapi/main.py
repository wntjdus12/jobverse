from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from passlib.context import CryptContext
from database import engine, Base, get_db
from models import User

from fastapi.responses import StreamingResponse
from pymongo import MongoClient

from bson import ObjectId
from pymongo import MongoClient
import gridfs


class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

Base.metadata.create_all(bind=engine)

client = MongoClient("mongodb://13.125.60.100:27017/")
db = client["jobdescription"]       

fs = gridfs.GridFS(db)   

file_path = "../assets/frontend_jobdescription.mp4"

with open(file_path, "rb") as f:
    file_id = fs.put(f, filename="frontend.mp4", content_type="video/mp4")

print(f"파일 업로드 완료! 파일 ID: {file_id}")



@app.post(
    "/register", 
    response_model=UserResponse, 
    status_code=status.HTTP_201_CREATED
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    사용자 아이디(username)와 비밀번호(password)를 받아 회원가입을 처리합니다.
    """
    try:

        hashed_password = pwd_context.hash(user_data.password)


        new_user = User(
            username=user_data.username,
            password=hashed_password
        )


        db.add(new_user)
        db.commit()
        db.refresh(new_user) 

        return new_user

    except IntegrityError:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 아이디입니다.",
        )

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """
    DB에 저장된 모든 사용자 정보를 조회합니다. (테스트 용도)
    주의: 실제 서비스에서는 비밀번호를 절대 반환하면 안 됩니다.
    """
    users = db.query(User).all()
    return users

# GridFS에서 chunk 단위로 읽어 스트리밍하는 제너레이터
def iterfile(grid_out, chunk_size=1024*1024):
    while True:
        chunk = grid_out.read(chunk_size)
        if not chunk:
            break
        yield chunk

@app.get("/video/{file_id}")
def stream_video(file_id: str):
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    try:
        grid_out = fs.get(oid)
    except gridfs.errors.NoFile:
        raise HTTPException(status_code=404, detail="File not found")

    response = StreamingResponse(iterfile(grid_out), media_type="video/mp4")

    return response