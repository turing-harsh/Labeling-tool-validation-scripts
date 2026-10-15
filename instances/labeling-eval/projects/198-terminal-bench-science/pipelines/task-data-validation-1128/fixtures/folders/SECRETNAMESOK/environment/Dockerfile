FROM python:3.13-slim-bookworm
ENV HF_HOME=/root/.cache/hf
RUN pip install --no-cache-dir numpy==2.1.3
WORKDIR /app
COPY data /app/data
