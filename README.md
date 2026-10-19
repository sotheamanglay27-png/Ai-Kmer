# FaceSwap AI Studio

Responsive Khmer-first face-swap video web app starter: React/Vite frontend + FastAPI backend + configurable Replicate inference adapter.

## Important
This is a runnable project scaffold, not a deployed website. Real face-swap processing requires a Replicate API token and a compatible video face-swap model/version. Model input names differ, so configure the field names to match the selected model. Do not use this for impersonation, fraud, or intimate imagery; only upload media you own or have permission to use.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set REPLICATE_API_TOKEN, REPLICATE_MODEL_VERSION and model input field names
uvicorn app:app --reload --port 8000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173). The frontend proxies `/api` to `http://localhost:8000`.

## Model configuration
Set `REPLICATE_MODEL_VERSION` to the version ID of a model that accepts a video and a face image. Configure `MODEL_VIDEO_INPUT_NAME` and `MODEL_IMAGE_INPUT_NAME` to the exact input keys expected by that model. The adapter uploads both files to Replicate, creates a prediction, and polls its status. Some models need extra input parameters; add them in `MODEL_EXTRA_INPUTS_JSON`. Verify the selected model's documented inputs and output format before use.

## Production checklist
- Use managed object storage and a durable job queue/database rather than in-memory jobs and local temporary files.
- Configure HTTPS, authentication, rate limits, upload quotas, malware/media validation, and a retention/deletion policy.
- Keep API tokens on the server only. Never place provider keys in frontend code.
- Set `CORS_ORIGINS` to your deployed frontend origin.
- Add consent and disclosure flows appropriate to your use case and jurisdiction.
