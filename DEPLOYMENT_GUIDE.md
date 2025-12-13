# Deployment Guide

This guide covers how to deploy the Attendance System using Docker (recommended for consistency) or Cloud Platforms.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
- Ensure `backend/.env` is configured with your MongoDB URI.

## Option 1: Run Locally with Docker Compose

This will create a production-like environment on your local machine.

1.  **Build and Run**:
    Open a terminal in the project root (`attendance-system/`) and run:

    ```bash
    docker-compose up --build
    ```

2.  **Access the App**:

    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

3.  **Stop**:
    Press `Ctrl+C` or run:
    ```bash
    docker-compose down
    ```

## Option 2: Deploy to a VPS (DigitalOcean, AWS, etc.)

1.  **Provision a Server** (e.g., Ubuntu 22.04).
2.  **Install Docker & Docker Compose** on the server.
3.  **Clone your repository** to the server.
4.  **Configure Environment**:
    - Create `backend/.env` with your production secrets.
    - Update `docker-compose.yml`:
      - Change `VITE_API_URL` under `frontend` args to your server's domain/IP (e.g., `http://your-server-ip:8000` or `https://api.yourdomain.com`).
5.  **Run**:
    ```bash
    docker-compose up --build -d
    ```
    (`-d` runs it in the background).

## Option 3: Cloud Platforms (Split Deployment)

### 1. Backend (Railway / Render)

The backend uses **DeepFace** and **TensorFlow**, which are memory-intensive.

- **Service**: Deploy the `backend/` folder as a Service.
- **Build Command**: `pip install -r requirements.txt` (or use Dockerfile).
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Environment Variables**: Add your `MONGODB_URL` and `SECRET_KEY`.
- **Note**: On free tiers (512MB RAM), DeepFace might crash. Use a paid plan or a VPS if this happens.

### 2. Frontend (Vercel / Netlify)

- **Service**: Import the repository and select `frontend` as the root directory.
- **Framework**: Vite.
- **Environment Variables**:
  - Set `VITE_API_URL` to your deployed backend URL (e.g., `https://attendance-backend.up.railway.app`).
- **Deploy**.

## Troubleshooting

- **DeepFace Models**: The first run might take time as it downloads face recognition models. In Docker, these are stored inside the container. To persist them, you can map a volume to `/root/.deepface`.
- **CORS**: If deployments fail to communicate, check `backend/app/main.py`. Ensure your frontend domain is added to `allow_origins` in `CORSMiddleware`.
