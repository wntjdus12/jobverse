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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from routers import video, portfolio

app.include_router(video.router)
app.include_router(portfolio.router)


@app.get("/")
def read_root():
    return {"message": "API is running."}