from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
from datetime import datetime

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __get_pydantic_json_schema__(cls, schema, handler):
        schema.update(type="string")
        return schema

# 프런트 요청: {"answers": {"1":"B","2":"C", ...}}
class MetacognitionAnswers(BaseModel):
    answers: dict[str, str]

# 레이더 차트용 점수 (정수 누적 유지)
class MetacognitionScores(BaseModel):
    result_oriented: int
    process_oriented: int
    ownership: int
    collaboration: int
    user_centric: int

class MetacognitionResult(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    scores: MetacognitionScores
    ai_advice: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class AnalysisResponse(BaseModel):
    scores: MetacognitionScores
    ai_advice: str
