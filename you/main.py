# main.py
from fastapi import FastAPI, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, Any, Optional
import os
import aiofiles
import json
import traceback
from urllib.parse import unquote, quote
from fpdf import FPDF
from pydantic import BaseModel
from utils import (
    get_job_title_from_slug,
    get_ai_feedback,
    retrieve_relevant_feedback_history,
    load_company_analysis,
    save_document_to_file_system,
    get_embedding,
    calculate_content_hash,
)
from job_data import JOB_CATEGORIES, JOB_DETAILS, get_job_document_schema

# 전역 설정
app = FastAPI()
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
COMPANIES_DATA_DIR = os.path.join(DATA_DIR, "companies")
COMPANY_ANALYSIS_FILE = os.path.join(COMPANIES_DATA_DIR, "current_company_analysis.json")
os.makedirs(COMPANIES_DATA_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")
templates = Jinja2Templates(directory="templates")

# Pydantic 모델
class AnalyzeDocumentRequest(BaseModel):
    job_title: str
    document_content: Dict[str, Any]
    version: int
    feedback_reflection: Optional[str] = None
    company_name: Optional[str] = None

class AnalyzeCompanyRequest(BaseModel):
    company_name: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "job_categories": JOB_CATEGORIES})

@app.get("/editor/{job_slug}", response_class=HTMLResponse)
async def get_document_editor_page(request: Request, job_slug: str):
    job_title = get_job_title_from_slug(job_slug)
    if not job_title:
        raise HTTPException(status_code=404, detail=f"Job not found: {unquote(job_slug)}")
    
    job_details = JOB_DETAILS.get(job_title, {})
    return templates.TemplateResponse(
        "document_editor.html",
        {"request": request, "job_title": job_title, "job_slug": job_slug, "job_details": job_details}
    )

@app.get("/api/document_schema/{doc_type}", response_class=JSONResponse)
async def get_document_schema_endpoint(doc_type: str, job_slug: str):
    job_title = get_job_title_from_slug(job_slug)
    if not job_title:
        raise HTTPException(status_code=404, detail="Job not found")

    schema = get_job_document_schema(job_title, doc_type)
    if not schema:
        raise HTTPException(status_code=404, detail="Document schema not found for this type or job.")
    return JSONResponse(content=schema)

@app.get("/api/load_documents/{job_slug}", response_class=JSONResponse)
async def api_load_documents(job_slug: str):
    job_title = get_job_title_from_slug(job_slug)
    if not job_title:
        raise HTTPException(status_code=404, detail=f"Job not found for slug: {unquote(job_slug)}")

    from utils import load_documents_from_file_system
    try:
        loaded_data = await load_documents_from_file_system(unquote(job_slug))
        return JSONResponse(content=loaded_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load documents: {e}")

@app.post("/api/analyze_company", response_class=JSONResponse)
async def analyze_company_endpoint(request_data: AnalyzeCompanyRequest):
    company_name = request_data.company_name
    if not company_name:
        raise HTTPException(status_code=400, detail="기업명을 입력해주세요.")

    from utils import perform_company_analysis
    return await perform_company_analysis(company_name, COMPANY_ANALYSIS_FILE)

@app.post("/api/analyze_document/{doc_type}")
async def analyze_document_endpoint(doc_type: str, request_data: AnalyzeDocumentRequest):
    try:
        job_title = request_data.job_title
        doc_content_dict = request_data.document_content
        new_version_number = request_data.version
        feedback_reflection = request_data.feedback_reflection
        company_name = request_data.company_name
        
        company_analysis = await load_company_analysis(company_name, COMPANY_ANALYSIS_FILE)
        job_slug = job_title.replace(" ", "-").replace("/", "-").lower()

        relevant_history_entries = await retrieve_relevant_feedback_history(
            job_slug=job_slug,
            doc_type=doc_type,
            current_content=doc_content_dict,
            current_version=new_version_number,
            top_k=2
        )
        
        previous_document_data = relevant_history_entries[0] if relevant_history_entries else None
        older_document_data = relevant_history_entries[1] if len(relevant_history_entries) > 1 else None

        feedback_response_json = await get_ai_feedback(
            job_title, doc_type, doc_content_dict,
            previous_document_data=previous_document_data,
            older_document_data=older_document_data,
            additional_user_context=feedback_reflection,
            company_name=company_name,
            company_analysis=company_analysis,
        )
        
        if feedback_response_json.status_code != 200:
            return feedback_response_json
        
        feedback_content = json.loads(feedback_response_json.body.decode('utf-8'))
        
        overall_ai_feedback = feedback_content.get("overall_feedback")
        individual_ai_feedbacks = feedback_content.get("individual_feedbacks", {})
        ai_summary = feedback_content.get("summary", "")
        
        text_for_current_embedding = ai_summary if doc_type == "portfolio" else (
            " ".join([
                json.dumps(doc_content_dict.get("education_highschool", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("education_university", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("education_graduate_school", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("extracurricular_activities", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("career", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("foreign_language", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("certifications", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("awards", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("training", ""), ensure_ascii=False),
                json.dumps(doc_content_dict.get("tech_stack", ""), ensure_ascii=False)
            ]) if doc_type == "resume" else (
                f"지원 이유: {doc_content_dict.get('reason_for_application', '')} "
                f"전문성 경험: {doc_content_dict.get('expertise_experience', '')} "
                f"협업 경험: {doc_content_dict.get('collaboration_experience', '')} "
                f"도전적 목표 경험: {doc_content_dict.get('challenging_goal_experience', '')} "
                f"성장 과정: {doc_content_dict.get('growth_process', '')}"
            )
        )
        
        current_doc_embedding = await get_embedding(text_for_current_embedding)
        current_content_hash = calculate_content_hash(doc_content_dict)

        doc_to_save = {
            "job_title": job_title, "doc_type": doc_type, "version": new_version_number,
            "content": doc_content_dict, "feedback": overall_ai_feedback,
            "individual_feedbacks": individual_ai_feedbacks,
            "embedding": current_doc_embedding, "content_hash": current_content_hash,
            "company_name": company_name,
        }

        await save_document_to_file_system(doc_to_save)

        return JSONResponse(content={
            "message": "Document analyzed and saved successfully!",
            "ai_feedback": overall_ai_feedback,
            "individual_feedbacks": individual_ai_feedbacks,
            "new_version_data": doc_to_save
        }, status_code=200)

    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error during analysis and saving: {e}")

@app.post("/api/portfolio_summary")
async def portfolio_summary(
    portfolio_pdf: Optional[UploadFile] = File(None),
    portfolio_link: Optional[str] = Form(None),
    job_title: str = Form(...),
    version: int = Form(1),
    feedback_reflection: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None)
):
    from utils import process_portfolio_summary
    return await process_portfolio_summary(portfolio_pdf, portfolio_link, job_title, version, feedback_reflection, company_name)


@app.get("/api/download_pdf/{job_slug}/{doc_type}/{filename}")
async def download_pdf_file(job_slug: str, doc_type: str, filename: str):
    file_path = os.path.join(DATA_DIR, job_slug, doc_type, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
        
    encoded_filename = quote(filename)
    content_disposition_header = f"attachment; filename*=UTF-8''{encoded_filename}"
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": content_disposition_header}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)