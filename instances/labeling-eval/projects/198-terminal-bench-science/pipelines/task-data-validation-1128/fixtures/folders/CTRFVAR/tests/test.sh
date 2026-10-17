#!/bin/bash
set -euo pipefail
LOG_DIR=/logs/verifier

if pytest -rA --ctrf "$LOG_DIR/ctrf.json" /tests/test_outputs.py; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
fi
