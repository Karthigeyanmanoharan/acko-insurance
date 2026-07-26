# backend/main.py
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import google.generativeai as genai

import auth
from routers import quote
from ai.rag_pipeline import rag_answer
from database import get_db
from sql_table import ChatLog
from auth import get_current_user

load_dotenv(dotenv_path="../.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found. Check your .env file.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash-lite")

app = FastAPI(title="Acko Insurance AI - Backend")

# CORS must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(quote.router)


# ---------------------------------------------------------------------------
# Root health check
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "message": "Acko backend is running"}


# ---------------------------------------------------------------------------
# Chat endpoint — RAG chatbot (Module 1)
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    answer, sources = rag_answer(request.message, model)

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