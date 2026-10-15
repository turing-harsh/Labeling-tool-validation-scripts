#!/bin/sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="${TASK_PROJECT_ROOT:-/app/project}"
cp "$SCRIPT_DIR/reference/engine.py" "$PROJECT_ROOT/engine.py"
cp -R "$SCRIPT_DIR/reference/lib" "$PROJECT_ROOT/lib"
