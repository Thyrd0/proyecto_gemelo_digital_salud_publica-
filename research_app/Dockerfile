FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY research_app ./research_app
COPY ml_pipeline ./ml_pipeline
COPY data ./data
COPY artifacts ./artifacts

EXPOSE 8501

CMD ["streamlit", "run", "research_app/streamlit_app.py", "--server.address=0.0.0.0", "--server.port=8501"]
