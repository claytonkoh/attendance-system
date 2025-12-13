FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# libgl1 is the modern replacement for libgl1-mesa-glx
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install heavy dependencies first for better caching and to avoid timeouts
RUN pip install --no-cache-dir --timeout=1000 tensorflow-cpu==2.15.0
RUN pip install --no-cache-dir --timeout=1000 deepface==0.0.79
RUN pip install --no-cache-dir --timeout=1000 mediapipe opencv-python-headless

# Install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
