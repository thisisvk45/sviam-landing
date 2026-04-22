FROM python:3.11-slim

WORKDIR /app

# Install system deps for weasyprint + lxml
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libpango-1.0-0 libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 libcairo2 libxml2-dev libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first — this layer is cached until requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN useradd -m -s /bin/bash appuser
USER appuser

# Copy app code — only this layer rebuilds on code changes
COPY . .

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-10000}/ping')"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
