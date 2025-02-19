from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import SeleniumURLLoader
from langchain_core.prompts import ChatPromptTemplate
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Ollama components
ollama_llm = OllamaLLM(model="deepseek-r1:1.5b")
embeddings = OllamaEmbeddings(model="deepseek-r1:1.5b")

# Vector stores for PDFs and URLs
pdf_vector_store = None
url_vector_store = Chroma(embedding_function=embeddings, persist_directory="./url_store")

# Chat template for URL queries
template = """
You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: {question} 
Context: {context} 
Answer:
"""
chat_prompt = ChatPromptTemplate.from_template(template)

class QueryRequest(BaseModel):
    query: str

class URLRequest(BaseModel):
    url: str

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global pdf_vector_store

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Extract text from PDF
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"

        if not text.strip():
            raise HTTPException(status_code=400, detail="PDF has no extractable text.")

        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)

        # Create vector store
        pdf_vector_store = Chroma.from_texts(chunks, embeddings)

        return {"message": "PDF uploaded and processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-url")
async def process_url(request: URLRequest):
    try:
        # Load URL content
        loader = SeleniumURLLoader(urls=[request.url])
        documents = loader.load()
        
        # Split text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        chunks = text_splitter.split_documents(documents)
        
        # Add to vector store
        url_vector_store.add_documents(chunks)
        
        return {"message": "URL processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query-pdf")
async def query_pdf(request: QueryRequest):
    if not pdf_vector_store:
        raise HTTPException(status_code=400, detail="No PDF uploaded yet")

    try:
        qa_chain = RetrievalQA.from_chain_type(
            llm=ollama_llm,
            chain_type="stuff",
            retriever=pdf_vector_store.as_retriever(),
        )
        response = qa_chain.run(request.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query-url")
async def query_url(request: QueryRequest):
    try:
        retrieved_docs = url_vector_store.similarity_search(request.query)
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        chain = chat_prompt | ollama_llm
        response = chain.invoke({"question": request.query, "context": context})
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
