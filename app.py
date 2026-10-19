from __future__ import annotations
import asyncio, json, os, tempfile, uuid
from pathlib import Path
from typing import Any
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()
app = FastAPI(title="FaceSwap AI Studio API", version="1.0.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["*"])

jobs: dict[str, dict[str, Any]] = {}
MAX_VIDEO = int(os.getenv("MAX_VIDEO_MB", "150")) * 1024 * 1024
MAX_IMAGE = int(os.getenv("MAX_IMAGE_MB", "15")) * 1024 * 1024
VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-matroska"}
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def config() -> tuple[str, str]:
    token = os.getenv("REPLICATE_API_TOKEN", "").strip()
    version = os.getenv("REPLICATE_MODEL_VERSION", "").strip()
    if not token or not version or "replace_with" in version:
        raise HTTPException(status_code=503, detail="AI backend មិនទាន់បានកំណត់ទេ។ សូមកំណត់ REPLICATE_API_TOKEN និង REPLICATE_MODEL_VERSION ក្នុង backend/.env។")
    return token, version

async def read_limited(file: UploadFile, max_bytes: int) -> bytes:
    chunks, total = [], 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk: break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail=f"ឯកសារធំពេក។ កំណត់អតិបរមា {max_bytes // (1024*1024)} MB។")
        chunks.append(chunk)
    data = b"".join(chunks)
    if not data: raise HTTPException(status_code=400, detail="ឯកសារទទេ។")
    return data

async def upload_replicate_file(client: httpx.AsyncClient, token: str, data: bytes, filename: str, mime: str) -> str:
    r = await client.post("https://api.replicate.com/v1/files", headers={"Authorization": f"Bearer {token}"}, files={"content": (filename, data, mime)})
    if r.is_error:
        raise HTTPException(status_code=502, detail=f"មិនអាចផ្ទុកឯកសារទៅសេវា AI បានទេ ({r.status_code})។ ពិនិត្យ API token និងការកំណត់គណនី។")
    body = r.json()
    url = body.get("urls", {}).get("get") or body.get("url")
    if not url: raise HTTPException(status_code=502, detail="សេវា AI មិនបានត្រឡប់ URL ឯកសារទេ។")
    return url

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FaceSwap AI Studio", "ai_configured": bool(os.getenv("REPLICATE_API_TOKEN") and os.getenv("REPLICATE_MODEL_VERSION") and "replace_with" not in os.getenv("REPLICATE_MODEL_VERSION", ""))}

@app.post("/api/jobs")
async def create_job(video: UploadFile = File(...), face_image: UploadFile = File(...), consent_confirmed: bool = Form(...)):
    if not consent_confirmed:
        raise HTTPException(status_code=400, detail="សូមបញ្ជាក់ថាអ្នកមានសិទ្ធិប្រើប្រាស់រូបថត និងវីដេអូនេះ។")
    if video.content_type not in VIDEO_TYPES:
        raise HTTPException(status_code=415, detail="សូមប្រើវីដេអូ MP4, MOV, WebM ឬ MKV។")
    if face_image.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="សូមប្រើរូបថត JPG, PNG ឬ WebP។")
    token, version = config()
    video_data = await read_limited(video, MAX_VIDEO)
    image_data = await read_limited(face_image, MAX_IMAGE)
    video_url = image_url = None
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            video_url = await upload_replicate_file(client, token, video_data, Path(video.filename or "video.mp4").name, video.content_type)
            image_url = await upload_replicate_file(client, token, image_data, Path(face_image.filename or "face.jpg").name, face_image.content_type)
            model_input = {
                os.getenv("MODEL_VIDEO_INPUT_NAME", "video"): video_url,
                os.getenv("MODEL_IMAGE_INPUT_NAME", "face_image"): image_url,
            }
            try:
                extra = json.loads(os.getenv("MODEL_EXTRA_INPUTS_JSON", "{}"))
                if isinstance(extra, dict): model_input.update(extra)
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="MODEL_EXTRA_INPUTS_JSON មិនមែនជា JSON ត្រឹមត្រូវទេ។")
            response = await client.post("https://api.replicate.com/v1/predictions", headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Prefer": "wait=1"}, json={"version": version, "input": model_input})
            if response.is_error:
                raise HTTPException(status_code=502, detail=f"សេវា AI បដិសេធសំណើ ({response.status_code})។ ពិនិត្យ model version និងឈ្មោះ input fields ក្នុង .env។")
            pred = response.json()
    except HTTPException:
        raise
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="មិនអាចភ្ជាប់ទៅសេវា AI បានទេ។ សូមព្យាយាមម្ដងទៀត។")
    job_id = str(uuid.uuid4())
    status = pred.get("status", "starting")
    output = pred.get("output")
    jobs[job_id] = {"id": job_id, "prediction_id": pred.get("id"), "status": status, "output": output, "error": pred.get("error"), "created_at": pred.get("created_at")}
    return {"id": job_id, "status": status, "output": output, "error": pred.get("error")}

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="រកមិនឃើញការងារនេះទេ។")
    if job.get("status") not in {"succeeded", "failed", "canceled"} and job.get("prediction_id"):
        token, _ = config()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"https://api.replicate.com/v1/predictions/{job['prediction_id']}", headers={"Authorization": f"Bearer {token}"})
        if not r.is_error:
            pred = r.json()
            job.update(status=pred.get("status", job["status"]), output=pred.get("output"), error=pred.get("error"))
    return {k: job.get(k) for k in ("id", "status", "output", "error", "created_at")}

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    jobs.pop(job_id, None)
    return JSONResponse({"deleted": True})
