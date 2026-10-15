FROM --platform=linux/amd64 node:22.14.0-bookworm-slim
WORKDIR /app/project
COPY environment/project/ /app/project/
COPY tests/test_engine.py tests/run_all.py tests/test.sh /tests/
RUN chmod 0500 /tests/test.sh
CMD ["/bin/bash"]
