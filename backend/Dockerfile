FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# libgl1 is the modern replacement for libgl1-mesa-glx
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies in a single layer to reduce image size and export time
RUN pip install --no-cache-dir --timeout=1000 \
    tensorflow-cpu==2.15.0 \
    deepface==0.0.79 \
    mediapipe \
    opencv-python-headless \
    scipy \
    pandas \
    matplotlib \
    scikit-learn

# Install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# FORCE REINSTALL PROTOBUF TO FIX MEDIAPIPE CRASH
# This must be the very last pip install to ensure it overrides everything else
RUN pip install --force-reinstall --no-cache-dir protobuf==3.20.3

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
