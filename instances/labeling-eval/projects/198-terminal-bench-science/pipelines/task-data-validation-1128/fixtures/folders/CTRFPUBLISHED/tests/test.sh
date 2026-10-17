#!/bin/bash
set -euo pipefail
mkdir -p /root/verifier-work

if pytest -rA --ctrf "/root/verifier-work/ctrf.json" /tests/test_outputs.py; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
fi
cp "/root/verifier-work/ctrf.json" "/logs/verifier/ctrf.json"
