# ======== ENVIRONMENT CONFIGURATION ========
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-token-123")  # Fallback for development
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))  # 100MB default
ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4']

from fastapi import Request  # ← Make sure this is imported
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os

import json 
import sqlite3
from datetime import datetime
import subprocess
from typing import Optional
# Add to your existing imports
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TranscriptionSaaS API")

# ======== RATE LIMITING SETUP ========

# Replace with your actual Vercel URLs and localhost for development
allowed_origins = [
    "https://transcriptionapp.vercel.app",  # ← ADD THIS
    "https://transcriptionapp-4xnd1wu14-ayoubs-projects-dc...",  # Keep for now
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← Allows ALL origins temporarily
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Add exception handler for rate limits
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again in a minute."}
    )

# ======== DATABASE SETUP ========

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect('transcriptions.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY, filename TEXT, status TEXT, 
                  transcription TEXT, error TEXT, created_at TEXT, 
                  completed_at TEXT, processing_time REAL)''')
    conn.commit()
    conn.close()

def save_job_to_db(job_data):
    """Save job to SQLite database"""
    conn = sqlite3.connect('transcriptions.db')
    c = conn.cursor()
    c.execute('''INSERT OR REPLACE INTO jobs 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (job_data['id'], job_data['file_name'], job_data['status'],
               json.dumps(job_data.get('transcription')), job_data.get('error'),
               job_data['created_at'], job_data.get('completed_at'),
               job_data.get('processing_time')))
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ======== ADD SECURITY SCHEME HERE ========

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    print(f"🔐 [AUTH] Received token: '{credentials.credentials}'")
    print(f"🔐 [AUTH] Expected token: '{SECRET_KEY}'")
    if credentials.credentials != SECRET_KEY:
        print("❌ [AUTH] Token mismatch!")
        raise HTTPException(status_code=401, detail="Invalid token")
    print("✅ [AUTH] Token accepted!")
    return {"user_id": "demo-user", "token": credentials.credentials}

# ======== ADD GLOBAL EXCEPTION HANDLER HERE ========

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"⚠️  [ERROR] {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary storage (replace with database later)
jobs_db = {}
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "TranscriptionSaaS API is running!"}

@app.post("/api/upload")
@limiter.limit("5/minute")  

# 5 uploads per minute per IP

async def upload_file(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...)):

    # ======== FILE SIZE VALIDATION ========
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Reset file pointer after reading
    await file.seek(0)

    # Validate file type
    if not file.filename.lower().endswith(('.mp3', '.wav', '.m4a', '.mp4')):
        raise HTTPException(400, "Unsupported file format")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # FIX: Proper filename handling
    original_filename = file.filename
    clean_filename = os.path.basename(original_filename)  # Remove path if any
    filename = f"{job_id}_{clean_filename}"  # Preserve original extension
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save uploaded file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Store job info
    jobs_db[job_id] = {
        "id": job_id,
        "file_name": clean_filename,
        "status": "uploaded",
        "created_at": datetime.now().isoformat(),
        "file_path": file_path,
        "transcription": None,
        "error": None
    }
    
     # Store job info IN BOTH memory and database
    jobs_db[job_id] = {
        "id": job_id,
        "file_name": clean_filename,
        "status": "uploaded",
        "created_at": datetime.now().isoformat(),
        "file_path": file_path,
        "transcription": None,
        "error": None
    }
    
    # SAVE TO DATABASE
    save_job_to_db(jobs_db[job_id])

    print(f"🟢 [UPLOAD] Job created: {job_id}")
    print(f"🟢 [UPLOAD] File saved: {file_path}")
    print(f"🟢 [UPLOAD] File exists: {os.path.exists(file_path)}")
    
    # Start transcription in background
    background_tasks.add_task(transcribe_audio, job_id, file_path)
    
    print(f"🟢 [UPLOAD] Background task added for job: {job_id}")
    
    return {
        "job_id": job_id,
        "status": "uploaded", 
        "message": "File uploaded. Transcription started."
    }

# Add this function somewhere in your main.py (usually after the routes)

async def transcribe_audio(job_id: str, file_path: str):
    try:
        # Update job status to processing
        jobs_db[job_id]["status"] = "processing"
        jobs_db[job_id]["started_at"] = datetime.now().isoformat()
        
	
        # UPDATE DATABASE
        save_job_to_db(jobs_db[job_id])

        print(f"● [TRANSCRIBE] STARTED for job: {job_id}")
        print(f"● [DEBUG] File path: {file_path}")
        
        # Verify file exists
        if not os.path.exists(file_path):
            error_msg = f"File not found: {file_path}"
            print(f"● [TRANSCRIBE] ERROR: {error_msg}")
            jobs_db[job_id]["status"] = "failed"
            jobs_db[job_id]["error"] = error_msg
            jobs_db[job_id]["completed_at"] = datetime.now().isoformat()
            return
        
        # Get absolute path
        abs_file_path = os.path.abspath(file_path)
        print(f"● [DEBUG] Absolute path: {abs_file_path}")
        
        # Run transcription
        start_time = datetime.now()
        result = subprocess.run([
            'python', 
            'C:/Users/Lenovo/Desktop/AI/whisper_api.py', 
            abs_file_path
        ], capture_output=True, text=True)
        processing_time = (datetime.now() - start_time).total_seconds()
        
        print(f"● [TRANSCRIBE] Process completed with return code: {result.returncode}")
        print(f"● [TRANSCRIBE] Processing time: {processing_time:.2f} seconds")
        
        if result.stdout:
            print(f"● [TRANSCRIBE] STDOUT: {result.stdout}")
        if result.stderr:
            print(f"● [TRANSCRIBE] STDERR: {result.stderr}")
        
        # Parse and store results
        if result.returncode == 0:
            try:
                # Extract transcription from stdout (assuming JSON output)
                transcription_data = result.stdout
                # If your whisper script outputs JSON, parse it:
                # import json
                # data = json.loads(transcription_data)
                # transcription_text = data.get("transcription", "")
                
                # For now, store the raw output
                jobs_db[job_id]["status"] = "completed"
                jobs_db[job_id]["transcription"] = transcription_data
                jobs_db[job_id]["processing_time"] = processing_time
                jobs_db[job_id]["completed_at"] = datetime.now().isoformat()
                
                print(f"● [TRANSCRIBE] COMPLETED for job: {job_id}")
                
            except Exception as parse_error:
                error_msg = f"Failed to parse transcription: {str(parse_error)}"
                print(f"● [TRANSCRIBE] PARSE ERROR: {error_msg}")
                jobs_db[job_id]["status"] = "failed"
                jobs_db[job_id]["error"] = error_msg
                jobs_db[job_id]["completed_at"] = datetime.now().isoformat()
                
        else:
            error_msg = result.stderr or "Transcription failed with unknown error"
            print(f"● [TRANSCRIBE] FAILED for job: {job_id} - {error_msg}")
            jobs_db[job_id]["status"] = "failed"
            jobs_db[job_id]["error"] = error_msg
            jobs_db[job_id]["completed_at"] = datetime.now().isoformat()

	# After completion/failure, update database again
        save_job_to_db(jobs_db[job_id])
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"● [TRANSCRIBE] EXCEPTION: {error_msg}")
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["error"] = error_msg
        jobs_db[job_id]["completed_at"] = datetime.now().isoformat()

@app.get("/api/jobs/{job_id}")
@limiter.limit("30/minute")  # 30 requests per minute per IP
async def get_job_status( request: Request, job_id: str, current_user: dict = Depends(get_current_user)):
    """Get job from database"""
    conn = sqlite3.connect('transcriptions.db')
    c = conn.cursor()
    c.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    job = c.fetchone()
    conn.close()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job[0],
        "file_name": job[1],
        "status": job[2],
        "transcription": json.loads(job[3]) if job[3] else None,
        "error": job[4],
        "created_at": job[5],
        "completed_at": job[6],
        "processing_time": job[7]
    }

@app.get("/api/jobs")
@limiter.limit("30/minute")  # 30 requests per minute per IP
async def list_jobs(request: Request, current_user: dict = Depends(get_current_user)):
    """List all jobs with basic info"""
    jobs_list = []
    for job_id, job_data in jobs_db.items():
        jobs_list.append({
            "id": job_data["id"],
            "file_name": job_data["file_name"],
            "status": job_data["status"],
            "created_at": job_data["created_at"],
            "processing_time": job_data.get("processing_time")
        })
    
    # Return newest first
    jobs_list.sort(key=lambda x: x["created_at"], reverse=True)
    return {"jobs": jobs_list, "total": len(jobs_list)}

@app.delete("/api/jobs/{job_id}")
@limiter.limit("10/minute")
async def delete_job(request: Request, job_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a job and its associated file"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = jobs_db[job_id]
    
    # Delete the audio file
    try:
        if os.path.exists(job_data["file_path"]):
            os.remove(job_data["file_path"])
            print(f"🗑️  [DELETE] File deleted: {job_data['file_path']}")
    except Exception as e:
        print(f"⚠️  [DELETE] Failed to delete file: {str(e)}")
    
    # Remove from database
    del jobs_db[job_id]
    
    return {"message": "Job deleted successfully", "job_id": job_id}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "total_jobs": len(jobs_db),
        "active_jobs": sum(1 for job in jobs_db.values() if job["status"] in ["uploaded", "processing"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)#   F o r c e   r e d e p l o y 
 
 