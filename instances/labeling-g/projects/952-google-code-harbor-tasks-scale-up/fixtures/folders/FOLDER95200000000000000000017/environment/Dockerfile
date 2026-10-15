FROM --platform=linux/amd64 python:3.11.9-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app/project
COPY project/ /app/project/
CMD ["sh"]
