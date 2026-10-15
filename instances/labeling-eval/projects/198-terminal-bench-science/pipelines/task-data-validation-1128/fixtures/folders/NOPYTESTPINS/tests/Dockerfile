FROM python:3.13-slim-bookworm
RUN pip install --no-cache-dir numpy==2.1.3
RUN mkdir -p /logs/verifier /app
COPY . /tests/
