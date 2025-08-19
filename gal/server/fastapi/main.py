from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="My Project API",
    description="GitHub, OpenAI, Video Streaming 기능을 제공하는 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8502","https://jobverse.site"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from routers import video, portfolio, metacognition, resume

app.include_router(video.router)
app.include_router(portfolio.router)
app.include_router(metacognition.router)
app.include_router(resume.router)


@app.get("/")
def read_root():
    return {"message": "API is running."}