# utils.py
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional, Tuple
import os
import aiofiles
import json
import traceback
from urllib.parse import unquote
import hashlib
import PyPDF2
import numpy as np
import io
from fpdf import FPDF
from job_data import JOB_CATEGORIES, JOB_DETAILS, get_job_document_schema
from prompts import get_document_analysis_prompt, get_company_analysis_prompt
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_MODEL = "gpt-4o"
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
COMPANIES_DATA_DIR = os.path.join(DATA_DIR, "companies")
COMPANY_ANALYSIS_FILE = os.path.join(COMPANIES_DATA_DIR, "current_company_analysis.json")

def get_job_title_from_slug(job_slug: str) -> Optional[str]:
    decoded_job_slug = unquote(job_slug)
    for category_jobs in JOB_CATEGORIES.values():
        for j_title in category_jobs:
            normalized_j_title_slug = j_title.replace(" ", "-").replace("/", "-").lower()
            if normalized_j_title_slug == decoded_job_slug:
                return j_title
    return None

async def get_ai_feedback(
    job_title: str,
    doc_type: str,
    document_content: Dict[str, Any],
    previous_document_data: Optional[Dict[str, Any]] = None,
    older_document_data: Optional[Dict[str, Any]] = None,
    additional_user_context: Optional[str] = None,
    company_name: Optional[str] = None,
    company_analysis: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    try:
        job_detail = JOB_DETAILS.get(job_title)
        job_competencies_list = job_detail.get("competencies") if job_detail else None

        system_instruction, user_prompt = get_document_analysis_prompt(
            job_title=job_title,
            doc_type=doc_type,
            document_content=document_content,
            job_competencies=job_competencies_list,
            previous_document_data=previous_document_data,
            older_document_data=older_document_data,
            additional_user_context=additional_user_context,
            company_name=company_name,
            company_analysis=company_analysis,
        )
        
        if user_prompt.startswith("오류:"):
            return JSONResponse(content={"error": user_prompt}, status_code=400)

        messages_for_ai = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ]

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages_for_ai,
            response_format={"type": "json_object"}
        )

        ai_raw_response = response.choices[0].message.content.strip()
        parsed_feedback = json.loads(ai_raw_response)
        
        summary_text = parsed_feedback.get("summary", "요약 내용을 생성할 수 없습니다.")
        overall_feedback = parsed_feedback.get("overall_feedback", "AI 피드백을 생성하는 데 문제가 발생했습니다.")
        individual_feedbacks = parsed_feedback.get("individual_feedbacks", {})

        if "찾을 수 없다" in overall_feedback or "유효한 포트폴리오 내용을 찾을 수 없" in overall_feedback or "unable to access external URLs" in overall_feedback:
            return JSONResponse(content={"error": overall_feedback}, status_code=400)

        return JSONResponse(content={
            "summary": summary_text,
            "overall_feedback": overall_feedback,
            "individual_feedbacks": individual_feedbacks
        }, status_code=200)

    except json.JSONDecodeError:
        return JSONResponse(
            content={
                "summary": "AI 응답 파싱 오류로 요약 불가",
                "overall_feedback": f"AI 응답 파싱 오류: 유효한 JSON 형식이 아닙니다. 원본: {ai_raw_response[:200]}...",
                "individual_feedbacks": {}
            }, 
            status_code=500
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(content={"error": f"AI 요약 오류: {e}"}, status_code=500)

async def get_embedding(text: str) -> List[float]:
    try:
        text = text.replace("\n", " ")
        response = client.embeddings.create(input=text, model=OPENAI_EMBEDDING_MODEL)
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")

def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    vec1_np = np.array(vec1)
    vec2_np = np.array(vec2)
    dot_product = np.dot(vec1_np, vec2_np)
    magnitude1 = np.linalg.norm(vec1_np)
    magnitude2 = np.linalg.norm(vec2_np)
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def calculate_content_hash(content: Dict[str, Any]) -> str:
    sorted_items_str = json.dumps(content, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(sorted_items_str.encode('utf-8')).hexdigest()

async def load_company_analysis(company_name: str, file_path: str) -> Optional[Dict[str, Any]]:
    if os.path.exists(file_path):
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
        loaded_analysis = json.loads(content)
        if loaded_analysis.get("company_name") == company_name:
            return loaded_analysis
    return None

async def perform_company_analysis(company_name: str, file_path: str) -> JSONResponse:
    try:
        existing_analysis = await load_company_analysis(company_name, file_path)
        if existing_analysis:
            return JSONResponse(content={
                "message": f"'{company_name}' 기업 분석을 성공적으로 불러왔습니다.",
                "company_analysis": existing_analysis
            })
        
        system_instruction, user_prompt = get_company_analysis_prompt(company_name)
        messages_for_ai = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ]
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages_for_ai,
            response_format={"type": "json_object"}
        )
        
        ai_raw_response = response.choices[0].message.content.strip()
        parsed_analysis = json.loads(ai_raw_response)
        parsed_analysis["company_name"] = company_name
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(parsed_analysis, ensure_ascii=False, indent=4))
        
        return JSONResponse(content={
            "message": f"'{company_name}' 기업 분석을 성공적으로 완료했습니다.",
            "company_analysis": parsed_analysis
        })

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"기업 분석 중 오류가 발생했습니다: {e}")

async def load_documents_from_file_system(job_slug: str) -> Dict[str, List[Dict[str, Any]]]:
    job_data_dir = os.path.join(DATA_DIR, job_slug)
    loaded_data = {"resume": [], "cover_letter": [], "portfolio": []}

    if not os.path.exists(job_data_dir):
        return loaded_data

    for doc_type in loaded_data.keys():
        doc_type_dir = os.path.join(job_data_dir, doc_type)
        if not os.path.exists(doc_type_dir):
            continue

        versions = []
        for filename in os.listdir(doc_type_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(doc_type_dir, filename)
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    content = await f.read()
                try:
                    doc_data = json.loads(content)
                    doc_data.setdefault("individual_feedbacks", {})
                    
                    if "embedding" not in doc_data or not doc_data["embedding"]:
                        print(f"Warning: Embedding missing for {job_slug}/{doc_type}/v{doc_data.get('version', 'N/A')}. Generating now...")
                        text_to_embed = ""
                        if doc_type == "cover_letter":
                            text_to_embed = " ".join([doc_data["content"].get(key, "") for key in ["reason_for_application", "expertise_experience", "collaboration_experience", "challenging_goal_experience", "growth_process"]])
                        elif doc_type == "resume":
                            text_to_embed = " ".join([json.dumps(doc_data["content"].get("education_history", ""), ensure_ascii=False), json.dumps(doc_data["content"].get("career_history", ""), ensure_ascii=False), doc_data["content"].get("certifications", ""), doc_data["content"].get("awards_activities", ""), doc_data["content"].get("skills_tech", "")])
                        elif doc_type == "portfolio":
                            text_to_embed = doc_data["content"].get("summary", "")
                        
                        if text_to_embed.strip():
                            doc_data["embedding"] = await get_embedding(text_to_embed)
                        else:
                            doc_data["embedding"] = []

                    versions.append(doc_data)
                except json.JSONDecodeError:
                    print(f"Error decoding JSON from {filename}")
        versions.sort(key=lambda x: x.get("version", 0))
        loaded_data[doc_type] = versions
    
    return loaded_data

async def save_document_to_file_system(document_data: Dict[str, Any]):
    job_slug = document_data["job_title"].replace(" ", "-").replace("/", "-").lower()
    doc_type = document_data["doc_type"]
    version = document_data["version"]

    job_data_dir = os.path.join(DATA_DIR, job_slug)
    doc_type_dir = os.path.join(job_data_dir, doc_type)
    os.makedirs(doc_type_dir, exist_ok=True)
    file_path = os.path.join(doc_type_dir, f"v{version}.json")

    async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
        await f.write(json.dumps(document_data, ensure_ascii=False, indent=4))
    
    return True

async def retrieve_relevant_feedback_history(
    job_slug: str,
    doc_type: str,
    current_content: Dict[str, Any],
    current_version: int,
    top_k: int = 2
) -> List[Dict[str, Any]]:
    all_docs_of_type = []
    loaded_all_docs = await load_documents_from_file_system(job_slug)
    if doc_type in loaded_all_docs:
        all_docs_of_type = [doc for doc in loaded_all_docs[doc_type] if doc.get("version", 0) < current_version]
        all_docs_of_type.sort(key=lambda x: x.get("version", 0), reverse=True) 

    text_for_current_embedding = ""
    if doc_type == "resume":
        text_for_current_embedding = " ".join([
            json.dumps(current_content.get("education_highschool", ""), ensure_ascii=False),
            json.dumps(current_content.get("education_university", ""), ensure_ascii=False),
            json.dumps(current_content.get("education_graduate_school", ""), ensure_ascii=False),
            json.dumps(current_content.get("extracurricular_activities", ""), ensure_ascii=False),
            json.dumps(current_content.get("career", ""), ensure_ascii=False),
            json.dumps(current_content.get("foreign_language", ""), ensure_ascii=False),
            json.dumps(current_content.get("certifications", ""), ensure_ascii=False),
            json.dumps(current_content.get("awards", ""), ensure_ascii=False),
            json.dumps(current_content.get("training", ""), ensure_ascii=False),
            json.dumps(current_content.get("tech_stack", ""), ensure_ascii=False)
        ])
    elif doc_type == "cover_letter":
        text_for_current_embedding = (
            f"지원 이유: {current_content.get('reason_for_application', '')} "
            f"전문성 경험: {current_content.get('expertise_experience', '')} "
            f"협업 경험: {current_content.get('collaboration_experience', '')} "
            f"도전적 목표 경험: {current_content.get('challenging_goal_experience', '')} "
            f"성장 과정: {current_content.get('growth_process', '')}"
        )
    elif doc_type == "portfolio":
        text_for_current_embedding = current_content.get("summary", "")
    elif doc_type in ["portfolio_summary_url", "portfolio_summary_text"]:
        text_for_current_embedding = current_content.get("portfolio_url", "") or current_content.get("extracted_text", "")

    if not text_for_current_embedding.strip():
        return []

    current_embedding = await get_embedding(text_for_current_embedding)
    if not current_embedding:
        return []
    
    sim_results = []
    for entry in all_docs_of_type:
        if "embedding" not in entry or not entry["embedding"]:
            continue
        similarity = _cosine_similarity(current_embedding, entry["embedding"])
        sim_results.append((similarity, entry))
            
    sim_results.sort(key=lambda x: x[0], reverse=True)
    retrieved_history = [entry for sim, entry in sim_results[:top_k]]
    retrieved_history.sort(key=lambda x: x.get("version", 0), reverse=True)
    
    return retrieved_history


async def process_portfolio_summary(portfolio_pdf, portfolio_link, job_title, version, feedback_reflection, company_name) -> JSONResponse:
    doc_type_for_prompt = ""
    prompt_content_for_ai = {}
    
    if portfolio_pdf and portfolio_pdf.filename:
        doc_type_for_prompt = "portfolio_summary_text"
        try:
            contents = await portfolio_pdf.read()
            if len(contents) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.")
            
            reader = PyPDF2.PdfReader(io.BytesIO(contents))
            extracted_text = "".join([page.extract_text() or "" for page in reader.pages])
            if not extracted_text.strip():
                raise HTTPException(status_code=400, detail="PDF에서 텍스트를 추출하지 못했습니다. 스캔된 이미지 PDF일 수 있습니다.")
            prompt_content_for_ai = {"extracted_text": extracted_text}
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"PDF 처리 중 오류가 발생했습니다: {str(e)}")
            
    elif portfolio_link and portfolio_link.strip():
        if not (portfolio_link.startswith('http://') or portfolio_link.startswith('https://')):
            portfolio_link = 'http://' + portfolio_link
        doc_type_for_prompt = "portfolio_summary_url"
        prompt_content_for_ai = {"portfolio_url": portfolio_link}
    else:
        raise HTTPException(status_code=400, detail="분석을 위해 PDF 파일 또는 유효한 링크를 입력해주세요.")
    
    try:
        job_slug = job_title.replace(" ", "-").replace("/", "-").lower()
        relevant_history_entries = await retrieve_relevant_feedback_history(
            job_slug=job_slug, doc_type="portfolio", current_content=prompt_content_for_ai, current_version=version, top_k=2
        )
        previous_document_data = relevant_history_entries[0] if relevant_history_entries else None
        older_document_data = relevant_history_entries[1] if len(relevant_history_entries) > 1 else None

        company_analysis = await load_company_analysis(company_name, COMPANY_ANALYSIS_FILE) if company_name else None
        if company_name and not company_analysis:
            print(f"Warning: No analysis found for company '{company_name}'. Proceeding with job-only feedback.")

        ai_response_json = await get_ai_feedback(
            job_title, doc_type_for_prompt, prompt_content_for_ai,
            previous_document_data=previous_document_data, older_document_data=older_document_data,
            additional_user_context=feedback_reflection, company_name=company_name, company_analysis=company_analysis
        )
        if ai_response_json.status_code != 200:
            return ai_response_json
        
        summary_content = json.loads(ai_response_json.body.decode('utf-8'))
        overall_summary_text = summary_content.get("summary", "요약 내용을 생성할 수 없습니다.")
        overall_feedback_text = summary_content.get("overall_feedback", "피드백 내용을 생성할 수 없습니다.")
        individual_feedbacks = summary_content.get("individual_feedbacks", {}) 
        if not overall_summary_text or overall_summary_text == "요약 내용을 생성할 수 없습니다.":
            raise HTTPException(status_code=500, detail="AI 요약 내용이 없습니다.")
    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI 요약 오류: {e}")

    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        font_path = os.path.join("static", "fonts", "NotoSansKR-Regular.ttf")
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"폰트 파일을 찾을 수 없습니다: {font_path}")
        pdf.add_font('NotoSansKR', '', font_path, uni=True)
        pdf.set_font('NotoSansKR', '', 12)
        pdf.multi_cell(0, 10, txt=f"{job_title} 포트폴리오 요약본\n", align='C')
        pdf.ln(10)
        pdf.set_font('NotoSansKR', '', 14)
        pdf.cell(0, 10, "▶ 포트폴리오 요약", ln=1, align='L')
        pdf.set_font('NotoSansKR', '', 12)
        pdf.multi_cell(0, 10, txt=overall_summary_text)
        pdf.ln(10)
        
        job_slug = job_title.replace(" ", "-").replace("/", "-").lower()
        doc_type_for_save = "portfolio"
        job_data_dir = os.path.join(DATA_DIR, job_slug, doc_type_for_save)
        os.makedirs(job_data_dir, exist_ok=True)
        pdf_filename = f"v{version}_summary.pdf"
        pdf_file_path = os.path.join(job_data_dir, pdf_filename)
        pdf.output(pdf_file_path)
        
        summary_embedding = await get_embedding(overall_summary_text)
        summary_content_hash = calculate_content_hash({"summary": overall_summary_text})
        doc_to_save = {
            "job_title": job_title, "doc_type": doc_type_for_save, "version": version,
            "content": {
                "portfolio_pdf_filename": portfolio_pdf.filename if portfolio_pdf else None,
                "portfolio_link": portfolio_link, "summary_type": doc_type_for_prompt,
                "summary": overall_summary_text,
                "download_pdf_url": f"/api/download_pdf/{job_slug}/{doc_type_for_save}/{pdf_filename}"
            },
            "feedback": overall_feedback_text, "individual_feedbacks": individual_feedbacks,
            "embedding": summary_embedding, "content_hash": summary_content_hash,
            "company_name": company_name,
        }
        await save_document_to_file_system(doc_to_save)
        
        return JSONResponse(content={
            "message": "AI 요약본이 생성되었습니다.",
            "overall_summary": overall_summary_text,
            "overall_feedback": overall_feedback_text,
            "individual_feedbacks": individual_feedbacks,
            "download_url": doc_to_save["content"]["download_pdf_url"]
        }, status_code=200)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF 생성 및 저장 오류: {e}")