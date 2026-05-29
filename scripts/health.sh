#!/usr/bin/env bash
# health.sh — one-shot snapshot of the stack. Faster than preflight,
# safe to run anytime. Prints a single-line summary.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")" && cd .. && pwd)}"

# Containers
c_running=$(docker compose -f "$ROOT/phenomenon/docker-compose.yml" ps 2>/dev/null | grep -c "Up" || echo 0)

# Backend health
b_ok=$(curl -s -m 3 http://host.docker.internal:8000/health 2>/dev/null | grep -c '"status":"ok"' || echo 0)

# Engine tests (quick)
e_pass=$(docker compose -f "$ROOT/phenomenon/docker-compose.yml" exec -T backend bash -c \
  "cd /workspace/packages/engine && python -m pytest tests/ -q 2>/dev/null | tail -1" 2>/dev/null | grep -oE '[0-9]+ passed' | head -1 || echo "?")

# Contracts in DB
c_total=$(curl -s -m 3 http://host.docker.internal:8000/phenomena/ 2>/dev/null | grep -oE '"id"' | wc -l | tr -d ' ' || echo "?")

echo "containers=$c_running/4  backend=$([ "$b_ok" -gt 0 ] && echo OK || echo DOWN)  engine_tests=$e_pass  contracts_in_db=$c_total"
