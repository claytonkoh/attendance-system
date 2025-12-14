FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# libgl1 and libglib2.0-0 are required for OpenCV (cv2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for Docker caching)
COPY requirements.txt .

# Install all dependencies from the file
# --no-cache-dir keeps the image small
RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# FINAL SAFETY NET: Ensure Protocol Buffers is strictly 3.20.3
# This fixes the "GetMessageClass" error if any other package tried to upgrade it
RUN pip install --force-reinstall --no-cache-dir protobuf==3.20.3

# Verify TensorFlow installation (debugging step - remove after confirming it works)
RUN python -c "import tensorflow as tf; print(f'TensorFlow version: {tf.__version__}'); from tensorflow import keras; print('Keras import successful')"

# Copy the rest of the project
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]