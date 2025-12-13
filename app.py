# main.py
from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import json
from core.ai_engine import generate_response
from core.self_learning import trigger_knowledge_update
from db.db_manager import (
    init_db,
    create_user_if_not_exists,
    save_message,
    get_user_history,
    delete_user_data,
    log_device_info
)
from pathlib import Path

app = FastAPI()
init_db()

# Serve static files (web UI)
app.mount("/static", StaticFiles(directory="web"), name="static")

@app.get("/")
def read_root():
    return {"message": "IT Mind AI - Ready for IT warriors."}

@app.post("/api/init")
async def init_session(request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID required")
    
    device_info = {
        "user_agent": request.headers.get("user-agent"),
        "host": request.client.host,
        "forwarded": request.headers.get("x-forwarded-for"),
    }
    create_user_if_not_exists(user_id)
    log_device_info(user_id, json.dumps(device_info))
    return {"status": "session ready"}

@app.post("/api/chat")
async def chat(request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID required")

    data = await request.json()
    query = data.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query required")

    # Simpan pertanyaan user
    save_message(user_id, query, is_user=True)

    # Generate jawaban (bebas, tanpa sensor)
    response = generate_response(query)

    # Simpan jawaban AI
    save_message(user_id, response, is_user=False)

    return JSONResponse({"response": response})

@app.get("/api/history")
async def history(request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID required")
    logs = get_user_history(user_id)
    return {"history": logs}

@app.delete("/api/data")
async def delete_data(request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID required")
    delete_user_data(user_id)
    return {"status": "all data deleted"}

@app.post("/api/upload")
async def upload_file(file: UploadFile, request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID required")
    
    # Hanya izinkan ekstensi aman
    allowed = {'.py', '.js', '.json', '.txt', '.yaml', '.md'}
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    upload_dir = Path("uploads") / user_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / file.filename

    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    return {"status": "file saved", "path": str(file_path)}

# Jalankan update pengetahuan setiap 24 jam (opsional via cron)
@app.post("/api/update-kb")
async def update_kb():
    trigger_knowledge_update()
    return {"status": "knowledge update triggered"}
