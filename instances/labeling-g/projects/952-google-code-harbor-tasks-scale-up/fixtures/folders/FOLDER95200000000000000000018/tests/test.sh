#!/bin/sh
set -eu
PROJECT_ROOT="${TASK_PROJECT_ROOT:-/app/project}"
TEST_ROOT="${TASK_TEST_ROOT:-/tests}"
LOG_ROOT="${HCAST_LOG_ROOT:-/logs/verifier}"
rm -rf "$TEST_ROOT/__pycache__"
cp -R "$TEST_ROOT/../environment/app" /tmp/app
mkdir -p "$LOG_ROOT"
printf '0\n' > "$LOG_ROOT/reward.txt"
if ! PYTHONPATH="$PROJECT_ROOT" python3 "$TEST_ROOT/run_all.py" --start-directory "$TEST_ROOT" > "$LOG_ROOT/unit.log" 2>&1; then
  cat "$LOG_ROOT/unit.log"
  exit 1
fi
printf '1\n' > "$LOG_ROOT/reward.txt"
