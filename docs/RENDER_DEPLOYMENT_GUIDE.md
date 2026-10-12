# Deploying AROGYA-TRIAGE Backend on Render

This guide outlines how to host the FastAPI backend for **AROGYA-TRIAGE** on [Render](https://render.com) for free with 100% cloud availability.

---

## 🚀 Option 1: 1-Click Render Blueprint (Fastest & Recommended)

Because a `render.yaml` specification is already committed to the repository root, Render can configure everything automatically:

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** (top right) ➔ Select **Blueprint**.
3. Connect your GitHub account and pick repository: **`GigaSachin/Arogya-Triage`**.
4. Render will detect `render.yaml` and show the service details:
   - **Service Name**: `arogya-triage-backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check**: `/health`
5. Click **Apply**.
6. Wait 1–2 minutes for the build to finish. Your backend will be live at:
   `https://arogya-triage-backend.onrender.com`

---

## 🛠️ Option 2: Manual Web Service Setup (Step-by-Step)

If you prefer to configure the Web Service manually in the Render UI:

1. Go to [Render Dashboard](https://dashboard.render.com/) ➔ Click **New +** ➔ Select **Web Service**.
2. Choose **Build and deploy from a Git repository** ➔ Select **`GigaSachin/Arogya-Triage`**.
3. Fill in the following fields:

| Setting | Value |
| :--- | :--- |
| **Name** | `arogya-triage-backend` |
| **Region** | `Singapore (Southeast Asia)` or `Frankfurt (EU)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

4. Scroll down to **Environment Variables** and add:
   - `PYTHON_VERSION` = `3.11.9`
   - `SARVAM_API_KEY` = `sk_abz9ebmo_tDWEvCUnbGVZfsc0IPHIQYOp`
   - `SARVAM_STT_MODEL` = `saaras:v3`
   - `SARVAM_TTS_MODEL` = `bulbul:v3`

5. (Optional) Expand **Advanced** ➔ set **Health Check Path** to:
   `/health`

6. Click **Create Web Service**.

---

## ✅ Verifying Your Live Render Backend

Once Render finishes the build (Status shows `Live` with a green dot), test these URLs:

1. **Health Check**:
   ```
   https://<your-render-app>.onrender.com/health
   ```
   *Expected response:* `{"status":"HEALTHY","service":"AROGYA-TRIAGE Enterprise Clinical Engine","version":"2.0.0",...}`

2. **Swagger OpenAPI Documentation**:
   ```
   https://<your-render-app>.onrender.com/docs
   ```
   *Interactive API test console with all endpoints (/api/intake, /api/queue, /api/voice/transcribe, /api/veterinary/*).*

3. **Engine Portal Overview**:
   ```
   https://<your-render-app>.onrender.com/
   ```
   *Shows live engine HUD status with service connections.*

---

## 🔗 Connecting Your Frontend to Render Backend

In your frontend (or if hosting the frontend on Vercel / Netlify):
- Set your frontend API proxy or target to: `https://<your-render-app>.onrender.com`
- CORS is already pre-configured to allow `*` origins on all routes.
