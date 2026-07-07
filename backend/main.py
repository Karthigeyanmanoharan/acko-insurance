import os
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import auth
from ai.rag_pipeline import rag_answer
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ChatLog
from auth import get_current_user


load_dotenv(dotenv_path="../.env")

gemini_api_key=os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY not found. Check your .env file.")

genai.configure(api_key=gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash-lite")

app = FastAPI(title="Acko Insurance AI - Backend")

app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # for development only; tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message:str

@app.get("/")
def root():
    return {"status": "ok", "message": "Acko backend is running"}



@app.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    answer, sources = rag_answer(request.message, model)

    # Log this Q&A so managers can review it later (Module 1 requirement)
    log_entry = ChatLog(
        user_id=current_user.id,
        intent="policy_qa",
        question=request.message,
        retrieved_source=", ".join(sources) if sources else None,
        response=answer,
    )
    db.add(log_entry)
    db.commit()

    return {"reply": answer, "sources": sources}