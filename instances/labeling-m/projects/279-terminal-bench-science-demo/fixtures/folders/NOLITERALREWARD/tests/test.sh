#!/bin/bash
set -euo pipefail

if pytest -rA --ctrf /logs/verifier/ctrf.json /tests/test_outputs.py; then
  echo "$score" > /logs/verifier/reward.txt
else
  echo "$score" > /logs/verifier/reward.txt
fi
