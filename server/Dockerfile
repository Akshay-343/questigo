# Questigo backend — FastAPI served by uvicorn.
FROM python:3.12-slim

# Faster, quieter Python in containers.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first so this layer is cached unless requirements change.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App code.
COPY app ./app
COPY scripts ./scripts

EXPOSE 8000

# 0.0.0.0 so the container is reachable from other services / the host.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
