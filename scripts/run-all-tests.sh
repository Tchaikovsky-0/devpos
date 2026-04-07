#!/bin/bash

# Xunjianbao - Complete Test Suite Runner
# Runs all tests: unit, integration, and E2E

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Xunjianbao - Complete Test Suite                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_E2E=false
GENERATE_COVERAGE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-only)
      RUN_FRONTEND=false
      RUN_E2E=false
      shift
      ;;
    --frontend-only)
      RUN_BACKEND=false
      RUN_E2E=false
      shift
      ;;
    --e2e)
      RUN_E2E=true
      shift
      ;;
    --coverage)
      GENERATE_COVERAGE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --backend-only    Run backend tests only"
      echo "  --frontend-only   Run frontend tests only"
      echo "  --e2e            Include E2E tests"
      echo "  --coverage        Generate coverage reports"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Track overall status
OVERALL_STATUS=0

# ============================================================================
# Backend Tests
# ============================================================================
if [ "$RUN_BACKEND" = true ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Backend Tests${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  cd "$PROJECT_ROOT/backend"

  # Run vet
  echo -e "${BLUE}Running go vet...${NC}"
  if go vet ./...; then
    echo -e "${GREEN}✓ Vet passed${NC}"
  else
    echo -e "${RED}✗ Vet failed${NC}"
    OVERALL_STATUS=1
  fi
  echo ""

  # Run unit tests
  echo -e "${BLUE}Running unit tests...${NC}"
  if [ "$GENERATE_COVERAGE" = true ]; then
    if go test -v -race \
      -coverprofile=coverage/unit.out \
      -covermode=atomic \
      ./internal/service/... \
      ./internal/handler/... \
      ./pkg/...; then
      echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
      echo -e "${RED}✗ Unit tests failed${NC}"
      OVERALL_STATUS=1
    fi
  else
    if go test -v -race \
      ./internal/service/... \
      ./internal/handler/... \
      ./pkg/...; then
      echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
      echo -e "${RED}✗ Unit tests failed${NC}"
      OVERALL_STATUS=1
    fi
  fi
  echo ""

  # Run integration tests
  echo -e "${BLUE}Running integration tests...${NC}"
  if [ "$GENERATE_COVERAGE" = true ]; then
    if go test -v -race \
      -coverprofile=coverage/integration.out \
      -covermode=atomic \
      ./tests/...; then
      echo -e "${GREEN}✓ Integration tests passed${NC}"
    else
      echo -e "${RED}✗ Integration tests failed${NC}"
      OVERALL_STATUS=1
    fi
  else
    if go test -v -race ./tests/...; then
      echo -e "${GREEN}✓ Integration tests passed${NC}"
    else
      echo -e "${RED}✗ Integration tests failed${NC}"
      OVERALL_STATUS=1
    fi
  fi
  echo ""

  # Generate coverage report
  if [ "$GENERATE_COVERAGE" = true ]; then
    echo -e "${BLUE}Generating coverage report...${NC}"
    mkdir -p coverage
    if [ -f coverage/unit.out ] && [ -f coverage/integration.out ]; then
      echo "mode: atomic" > coverage/coverage.out
      grep -v "^mode:" coverage/unit.out >> coverage/coverage.out 2>/dev/null || true
      grep -v "^mode:" coverage/integration.out >> coverage/coverage.out 2>/dev/null || true
    fi
    go tool cover -html=coverage/coverage.out -o=coverage/coverage.html 2>/dev/null || true
    COVERAGE=$(go tool cover -func=coverage/coverage.out 2>/dev/null | grep total | awk '{print $3}' || echo "N/A")
    echo -e "${GREEN}Backend Coverage: $COVERAGE${NC}"
  fi
  echo ""
fi

# ============================================================================
# Frontend Tests
# ============================================================================
if [ "$RUN_FRONTEND" = true ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Frontend Tests${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  cd "$PROJECT_ROOT/frontend"

  # Run unit tests
  echo -e "${BLUE}Running unit tests...${NC}"
  if [ "$GENERATE_COVERAGE" = true ]; then
    if pnpm test:run --coverage --coverage.reporter=text --coverage.reporter=json; then
      echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
      echo -e "${RED}✗ Unit tests failed${NC}"
      OVERALL_STATUS=1
    fi
  else
    if pnpm test:run; then
      echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
      echo -e "${RED}✗ Unit tests failed${NC}"
      OVERALL_STATUS=1
    fi
  fi
  echo ""

  # Run integration tests
  echo -e "${BLUE}Running integration tests...${NC}"
  if pnpm test:run tests/integration; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
  else
    echo -e "${RED}✗ Integration tests failed${NC}"
    OVERALL_STATUS=1
  fi
  echo ""
fi

# ============================================================================
# E2E Tests
# ============================================================================
if [ "$RUN_E2E" = true ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  E2E Tests${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  cd "$PROJECT_ROOT/frontend"

  echo -e "${BLUE}Installing Playwright browsers...${NC}"
  pnpm exec playwright install chromium
  echo ""

  echo -e "${BLUE}Running E2E tests...${NC}"
  if pnpm exec playwright test --reporter=list --project=chromium; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
  else
    echo -e "${RED}✗ E2E tests failed${NC}"
    OVERALL_STATUS=1
  fi
  echo ""
fi

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $OVERALL_STATUS -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  exit 1
fi
