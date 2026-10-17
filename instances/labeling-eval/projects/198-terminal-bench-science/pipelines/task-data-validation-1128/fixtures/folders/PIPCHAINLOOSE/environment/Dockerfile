FROM python:3.13-slim-bookworm
RUN pip install --no-cache-dir numpy==2.1.3 && pip install scipy && chmod 700 /app
WORKDIR /app
COPY data /app/data
