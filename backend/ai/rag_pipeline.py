import os
import shutil
import glob
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


BASE_DIR=os.path.dirname(os.path.abspath(__file__))

PDF_DIR=os.path.abspath(os.path.join(BASE_DIR,"..","..","data","pdfs"))
CHROMA_DIR=os.path.abspath(os.path.join(BASE_DIR,"..","..","data","chroma_db"))

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__),"..","..",".env"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found. Check your .env file.")

CHUNK_SIZE=1000
CHUNK_OVERLAP=200

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def load_all_pdfs():
    pdf_paths=glob.glob(os.path.join(PDF_DIR,"*.pdf"))
    if not pdf_paths:
        raise FileNotFoundError(f"No PDFs found in {PDF_DIR}. Add some files first.")
    all_pages=[]
    for pdf_path in pdf_paths:
        filename=os.path.basename(pdf_path)
        print(f"Loading:{filename}")

        loader=PyPDFLoader(pdf_path)
        pages=loader.load()
        all_pages.extend(pages)

        print(f"   → {len(pages)} pages")
    print(f"\n📚 Total pages across all PDFs: {len(all_pages)}")
    return all_pages

def split_into_chunks(pages):
    print(f"✂️  Splitting {len(pages)} pages into chunks...")
    splitter=RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
)
    chunks=splitter.split_documents(pages)

    avg_size = sum(len(c.page_content) for c in chunks) // len(chunks)
    print(f"✅ Created {len(chunks)} chunks (avg {avg_size} chars each)")

    return chunks


def build_vectorstore(chunks):
    """Embed chunks with Gemini and persist them to ChromaDB on disk."""

    # If a previous ChromaDB exists, wipe it so we don't append duplicates.
    if os.path.exists(CHROMA_DIR):
        print(f"⚠️  Existing ChromaDB found — deleting {CHROMA_DIR}")
        shutil.rmtree(CHROMA_DIR)

    print(f"🧠 Embedding {len(chunks)} chunks with Gemini... (this may take 2-5 minutes)")

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
    )

    print(f"✅ Vector store built at {CHROMA_DIR}")
    return vectorstore


def test_search(query: str, k: int = 3):
    """Quick sanity check: search ChromaDB for chunks matching a query."""
    print(f"\n🔎 Searching for: '{query}'\n")

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )

    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings,
    )

    results = vectorstore.similarity_search(query, k=k)

    for i, doc in enumerate(results, start=1):
        source = os.path.basename(doc.metadata.get("source", "unknown"))
        page   = doc.metadata.get("page", "?")
        print(f"--- Result {i} (from {source}, page {page}) ---")
        print(doc.page_content[:300])
        print()


# ---------------------------------------------------------------------------
# Cache the embeddings model + vectorstore so they load ONCE per server
# process, not on every single chat message. Loading HuggingFaceEmbeddings
# from disk takes a few seconds — doing that on every request made the
# chatbot feel like it was "hanging" / "refreshing" on each question.
# ---------------------------------------------------------------------------
_embeddings_cache = None
_vectorstore_cache = None


def _get_vectorstore():
    global _embeddings_cache, _vectorstore_cache
    if _vectorstore_cache is None:
        print("🧠 Loading embedding model + ChromaDB (first request only)...")
        _embeddings_cache = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
        )
        _vectorstore_cache = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=_embeddings_cache,
        )
        print("✅ Embedding model + ChromaDB ready (cached for future requests)")
    return _vectorstore_cache


def get_retriever(k=3):
    """Return a retriever (top-k search) backed by the cached vectorstore."""
    return _get_vectorstore().as_retriever(search_kwargs={"k": k})


def rag_answer(question: str, gemini_model):
    """Retrieve relevant chunks, build a grounded prompt, and ask Gemini.

    Returns (answer_text, list_of_sources) where sources are
    'filename.pdf - page N' strings used for citation/logging.
    """
    retriever = get_retriever(k=3)
    docs = retriever.invoke(question)

    if not docs:
        return ("I couldn't find anything relevant in our policy documents "
                 "for that question. Could you rephrase it?"), []

    context_parts = []
    sources = []
    for doc in docs:
        source = os.path.basename(doc.metadata.get("source", "unknown"))
        page = doc.metadata.get("page", "?")
        context_parts.append(doc.page_content)
        sources.append(f"{source} - page {page}")

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are Acko Insurance's AI assistant. Answer the customer's
    question using ONLY the context below, taken from real Acko policy documents.
    If the answer isn't in the context, say you don't have that information and
    suggest they contact Acko support. Be clear, friendly, and concise.

CONTEXT:
{context}

CUSTOMER QUESTION:
{question}

ANSWER:"""

    response = gemini_model.generate_content(prompt)
    return response.text, sources
    

if __name__ == "__main__":
    import sys

    # Mode 1: rebuild the vector DB (ingestion)
    # Mode 2: test the existing vector DB (search)
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_search("Does Acko bike insurance cover theft?")
        test_search("What is the waiting period for health insurance?")
        test_search("How do I file a motor insurance claim?")
    else:
        print(f"📁 PDF_DIR    = {PDF_DIR}")
        print(f"📁 CHROMA_DIR = {CHROMA_DIR}")
        print()
        pages  = load_all_pdfs()
        chunks = split_into_chunks(pages)
        vectorstore = build_vectorstore(chunks)
        count = vectorstore._collection.count()
        print(f"\n🔢 Vectors in ChromaDB: {count}")