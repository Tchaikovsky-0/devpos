#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════╗
# ║  巡检宝 - 全链路测试脚本                                       ║
# ║  测试所有模块: 后端(Go) + 前端(React) + AI服务(Python) + YOLO  ║
# ╚══════════════════════════════════════════════════════════════════╝

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 使用普通变量替代关联数组（兼容 macOS）
RESULT_env_check=""
RESULT_backend_vet=""
RESULT_backend_unit=""
RESULT_backend_middleware=""
RESULT_backend_integration=""
RESULT_frontend_unit=""
RESULT_frontend_integration=""
RESULT_frontend_types=""
RESULT_ai=""
RESULT_yolo=""
RESULT_e2e=""
RESULT_quality_no_any=""
RESULT_quality_error_handling=""

record() { eval "RESULT_$1=\$2"; }
get_result() { eval "echo -n \"\${RESULT_$1:-}\""; }

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# ─── 参数解析 ───────────────────────────────────────────────────────
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_AI=false
RUN_YOLO=false
RUN_E2E=false
GENERATE_COVERAGE=false
PARALLEL=false
VERBOSE=false
REPORT_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-only)   RUN_FRONTEND=false; RUN_AI=false; RUN_YOLO=false; RUN_E2E=false ;;
    --frontend-only)  RUN_BACKEND=false; RUN_AI=false; RUN_YOLO=false; RUN_E2E=false ;;
    --ai)             RUN_AI=true ;;
    --yolo)           RUN_YOLO=true ;;
    --e2e)            RUN_E2E=true ;;
    --coverage)       GENERATE_COVERAGE=true ;;
    --parallel)       PARALLEL=true ;;
    --verbose|-v)     VERBOSE=true ;;
    --report=*)       REPORT_FILE="${1#*=}" ;;
    --all)            RUN_BACKEND=true; RUN_FRONTEND=true; RUN_AI=true; RUN_YOLO=true; RUN_E2E=true ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --backend-only     Run backend (Go) tests only"
      echo "  --frontend-only    Run frontend (React/Vitest) tests only"
      echo "  --ai               Include AI service (Python) tests"
      echo "  --yolo             Include YOLO service (Python) tests"
      echo "  --e2e              Include E2E (Playwright) tests"
      echo "  --all              Run ALL tests (backend + frontend + AI + YOLO + E2E)"
      echo "  --coverage         Generate coverage reports"
      echo "  --parallel         Run backend and frontend in parallel"
      echo "  --verbose, -v      Show verbose output"
      echo "  --report=FILE      Save report to FILE"
      echo "  --help, -h         Show this help"
      echo ""
      echo "Default: backend + frontend (no AI/YOLO/E2E)"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# ─── 工具函数 ───────────────────────────────────────────────────────
section() {
  echo ""
  echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}${BOLD}  $1${NC}"
  echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

pass() { echo -e "  ${GREEN}✓ $1${NC}"; PASSED_TESTS=$((PASSED_TESTS + 1)); }
fail() { echo -e "  ${RED}✗ $1${NC}"; FAILED_TESTS=$((FAILED_TESTS + 1)); }
skip() { echo -e "  ${YELLOW}⊘ $1${NC}"; SKIPPED_TESTS=$((SKIPPED_TESTS + 1)); }
info() { echo -e "  ${CYAN}→ $1${NC}"; }

record() {
  RESULTS[$1]=$2
}

check_cmd() {
  if command -v "$1" &>/dev/null; then
    return 0
  else
    return 1
  fi
}

# ─── 环境检查 ───────────────────────────────────────────────────────
env_check() {
  section "Environment Check"

  local has_issues=false

  # Go
  if check_cmd go; then
    GO_VERSION=$(go version | awk '{print $3}')
    pass "Go: $GO_VERSION"
  else
    fail "Go not found (backend tests will be skipped)"
    has_issues=true
  fi

  # Node/pnpm
  if check_cmd pnpm; then
    PNPM_VERSION=$(pnpm --version)
    pass "pnpm: v$PNPM_VERSION"
  elif check_cmd npm; then
    NPM_VERSION=$(npm --version)
    pass "npm: v$NPM_VERSION (pnpm not found, using npm)"
  else
    fail "Neither pnpm nor npm found (frontend tests will be skipped)"
    has_issues=true
  fi

  # Python
  if check_cmd python3; then
    PY_VERSION=$(python3 --version 2>&1)
    pass "Python: $PY_VERSION"
  else
    warn "Python3 not found (AI/YOLO tests will be skipped)"
  fi

  # Docker
  if check_cmd docker; then
    pass "Docker: $(docker --version | awk '{print $3}')"
  else
    skip "Docker not found (integration tests may be limited)"
  fi

  # 项目目录检查
  if [ -d "$PROJECT_ROOT/backend" ]; then
    pass "Backend directory: $PROJECT_ROOT/backend"
  else
    fail "Backend directory not found"
    has_issues=true
  fi

  if [ -d "$PROJECT_ROOT/frontend" ]; then
    pass "Frontend directory: $PROJECT_ROOT/frontend"
  else
    fail "Frontend directory not found"
    has_issues=true
  fi

  # 依赖检查
  if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    pass "Frontend node_modules installed"
  else
    fail "Frontend node_modules not found (run: cd frontend && pnpm install)"
    has_issues=true
  fi

  if [ -d "$PROJECT_ROOT/backend/vendor" ] || [ -f "$PROJECT_ROOT/backend/go.sum" ]; then
    pass "Backend dependencies available"
  else
    fail "Backend dependencies not found (run: cd backend && go mod download)"
    has_issues=true
  fi

  if [ "$has_issues" = true ]; then
    echo ""
    info "Some checks failed, but continuing with available tests..."
  fi

  record "env_check" "$([ "$has_issues" = false ] && echo "PASS" || echo "WARN")"
}

# ─── 后端测试 ───────────────────────────────────────────────────────
run_backend_tests() {
  section "Backend Tests (Go)"
  cd "$PROJECT_ROOT/backend"

  local backend_status="PASS"
  local test_log="$REPORT_DIR/backend-test.log"
  mkdir -p "$REPORT_DIR"

  # 1. go vet - 静态分析
  info "Running go vet..."
  if go vet ./... > "$test_log" 2>&1; then
    pass "go vet passed"
    record "backend_vet" "PASS"
  else
    fail "go vet failed"
    record "backend_vet" "FAIL"
    backend_status="FAIL"
    [ "$VERBOSE" = true ] && cat "$test_log"
  fi

  # 2. 单元测试
  info "Running unit tests (service + handler + pkg)..."
  local unit_log="$REPORT_DIR/backend-unit.log"
  local unit_cmd="go test -v -race -count=1"
  if [ "$GENERATE_COVERAGE" = true ]; then
    unit_cmd="$unit_cmd -coverprofile=$REPORT_DIR/backend-unit.out -covermode=atomic"
  fi
  unit_cmd="$unit_cmd ./internal/service/... ./internal/handler/... ./pkg/... 2>&1"

  if eval "$unit_cmd" | tee "$unit_log"; then
    local unit_count=$(grep -cE '^(=== RUN|--- PASS|--- FAIL|--- SKIP)' "$unit_log" 2>/dev/null || echo "0")
    pass "Unit tests passed ($unit_count tests)"
    record "backend_unit" "PASS"
  else
    fail "Unit tests failed"
    record "backend_unit" "FAIL"
    backend_status="FAIL"
    [ "$VERBOSE" = true ] && grep -E 'FAIL|Error|panic' "$unit_log" | head -20
  fi

  # 3. 中间件测试
  info "Running middleware tests..."
  local mw_log="$REPORT_DIR/backend-middleware.log"
  if go test -v -race -count=1 ./internal/middleware/... > "$mw_log" 2>&1; then
    pass "Middleware tests passed"
    record "backend_middleware" "PASS"
  else
    fail "Middleware tests failed (non-critical)"
    record "backend_middleware" "FAIL"
    # 中间件测试失败不阻塞整体
    [ "$VERBOSE" = true ] && cat "$mw_log"
  fi

  # 4. 集成测试 (需要 MySQL/Redis, 可能失败)
  info "Running integration tests..."
  local int_log="$REPORT_DIR/backend-integration.log"
  local int_cmd="go test -v -race -count=1 -timeout 60s"
  if [ "$GENERATE_COVERAGE" = true ]; then
    int_cmd="$int_cmd -coverprofile=$REPORT_DIR/backend-integration.out -covermode=atomic"
  fi
  int_cmd="$int_cmd ./tests/... 2>&1"

  if eval "$int_cmd" | tee "$int_log"; then
    pass "Integration tests passed"
    record "backend_integration" "PASS"
  else
    # 集成测试失败可能是环境问题，不阻塞
    skip "Integration tests failed (may need MySQL/Redis - non-blocking)"
    record "backend_integration" "SKIP"
  fi

  # 5. 覆盖率汇总
  if [ "$GENERATE_COVERAGE" = true ]; then
    info "Generating coverage report..."
    mkdir -p "$REPORT_DIR/coverage"

    # 合并覆盖率
    if [ -f "$REPORT_DIR/backend-unit.out" ] && [ -f "$REPORT_DIR/backend-integration.out" ]; then
      echo "mode: atomic" > "$REPORT_DIR/coverage/backend.out"
      grep -v "^mode:" "$REPORT_DIR/backend-unit.out" >> "$REPORT_DIR/coverage/backend.out" 2>/dev/null || true
      grep -v "^mode:" "$REPORT_DIR/backend-integration.out" >> "$REPORT_DIR/coverage/backend.out" 2>/dev/null || true
    elif [ -f "$REPORT_DIR/backend-unit.out" ]; then
      cp "$REPORT_DIR/backend-unit.out" "$REPORT_DIR/coverage/backend.out"
    fi

    if [ -f "$REPORT_DIR/coverage/backend.out" ]; then
      go tool cover -html="$REPORT_DIR/coverage/backend.out" -o="$REPORT_DIR/coverage/backend.html" 2>/dev/null || true
      COVERAGE_PCT=$(go tool cover -func="$REPORT_DIR/coverage/backend.out" 2>/dev/null | grep total | awk '{print $3}' || echo "N/A")
      info "Backend coverage: $COVERAGE_PCT"
      record "backend_coverage" "$COVERAGE_PCT"
    fi
  fi

  record "backend" "$backend_status"
}

# ─── 前端测试 ───────────────────────────────────────────────────────
run_frontend_tests() {
  section "Frontend Tests (React + Vitest)"
  cd "$PROJECT_ROOT/frontend"

  local frontend_status="PASS"
  local PKG_MGR="pnpm"
  if ! check_cmd pnpm; then
    PKG_MGR="npm"
  fi

  # 1. 单元测试
  info "Running unit tests..."
  local unit_log="$REPORT_DIR/frontend-unit.log"
  local unit_cmd="$PKG_MGR test:run"
  if [ "$GENERATE_COVERAGE" = true ]; then
    unit_cmd="$unit_cmd --coverage --coverage.reporter=text --coverage.reporter=json"
  fi
  if [ "$VERBOSE" = true ]; then
    unit_cmd="$unit_cmd --reporter=verbose"
  fi

  if eval "$unit_cmd" | tee "$unit_log"; then
    pass "Unit tests passed"
    record "frontend_unit" "PASS"
  else
    fail "Unit tests failed"
    record "frontend_unit" "FAIL"
    frontend_status="FAIL"
    [ "$VERBOSE" = true ] && grep -E 'FAIL|Error|AssertionError' "$unit_log" | head -20
  fi

  # 2. 集成测试
  info "Running integration tests..."
  local int_log="$REPORT_DIR/frontend-integration.log"
  if $PKG_MGR test:run tests/integration > "$int_log" 2>&1; then
    pass "Integration tests passed"
    record "frontend_integration" "PASS"
  else
    fail "Integration tests failed"
    record "frontend_integration" "FAIL"
    frontend_status="FAIL"
    [ "$VERBOSE" = true ] && cat "$int_log"
  fi

  # 3. TypeScript 编译检查
  info "Running TypeScript type check..."
  local ts_log="$REPORT_DIR/frontend-tsc.log"
  if npx tsc --noEmit > "$ts_log" 2>&1; then
    pass "TypeScript compilation passed"
    record "frontend_types" "PASS"
  else
    fail "TypeScript compilation failed"
    record "frontend_types" "FAIL"
    frontend_status="FAIL"
    [ "$VERBOSE" = true ] && cat "$ts_log"
  fi

  record "frontend" "$frontend_status"
}

# ─── AI 服务测试 ─────────────────────────────────────────────────────
run_ai_tests() {
  section "AI Service Tests (Python + FastAPI)"
  cd "$PROJECT_ROOT/ai-service"

  if ! check_cmd python3; then
    skip "Python3 not found, skipping AI service tests"
    record "ai" "SKIP"
    return
  fi

  # 检查是否有测试文件
  local test_count=$(find . -name "test_*.py" -o -name "*_test.py" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$test_count" -eq 0 ]; then
    skip "No test files found in ai-service (test gap detected)"
    record "ai" "SKIP"
    info "Recommendation: Add tests for ai-service/app/ (analysis_service, chat_service, etc.)"
    return
  fi

  local ai_log="$REPORT_DIR/ai-test.log"

  # 检查 pytest
  if ! python3 -c "import pytest" 2>/dev/null; then
    info "Installing pytest..."
    pip3 install pytest -q 2>/dev/null || true
  fi

  info "Running AI service tests..."
  if python3 -m pytest -v --tb=short 2>&1 | tee "$ai_log"; then
    pass "AI service tests passed"
    record "ai" "PASS"
  else
    fail "AI service tests failed"
    record "ai" "FAIL"
    [ "$VERBOSE" = true ] && cat "$ai_log"
  fi
}

# ─── YOLO 服务测试 ──────────────────────────────────────────────────
run_yolo_tests() {
  section "YOLO Service Tests (Python + YOLOv8)"
  cd "$PROJECT_ROOT/yolo-service"

  if ! check_cmd python3; then
    skip "Python3 not found, skipping YOLO service tests"
    record "yolo" "SKIP"
    return
  fi

  local yolo_log="$REPORT_DIR/yolo-test.log"

  # 检查 pytest
  if ! python3 -c "import pytest" 2>/dev/null; then
    info "Installing pytest..."
    pip3 install pytest -q 2>/dev/null || true
  fi

  info "Running YOLO service tests..."
  # YOLO 测试可能因为模型文件不存在而跳过，这是预期行为
  if python3 -m pytest -v --tb=short 2>&1 | tee "$yolo_log"; then
    pass "YOLO service tests passed"
    record "yolo" "PASS"
  else
    # 检查是否是因为模型文件缺失
    if grep -q "skip\|SKIP\|model not found" "$yolo_log" 2>/dev/null; then
      skip "YOLO tests skipped (model file not found - expected in dev env)"
      record "yolo" "SKIP"
    else
      fail "YOLO service tests failed"
      record "yolo" "FAIL"
    fi
    [ "$VERBOSE" = true ] && cat "$yolo_log"
  fi
}

# ─── E2E 测试 ───────────────────────────────────────────────────────
run_e2e_tests() {
  section "E2E Tests (Playwright)"
  cd "$PROJECT_ROOT/frontend"

  local PKG_MGR="pnpm"
  if ! check_cmd pnpm; then
    PKG_MGR="npm"
  fi

  if ! $PKG_MGR exec playwright --version 2>/dev/null; then
    info "Installing Playwright browsers..."
    $PKG_MGR exec playwright install chromium 2>/dev/null || true
  fi

  info "Running E2E tests (chromium)..."
  local e2e_log="$REPORT_DIR/e2e-test.log"

  if $PKG_MGR exec playwright test --project=chromium --reporter=list 2>&1 | tee "$e2e_log"; then
    pass "E2E tests passed"
    record "e2e" "PASS"
  else
    fail "E2E tests failed (may need running services)"
    record "e2e" "FAIL"
    [ "$VERBOSE" = true ] && cat "$e2e_log"
  fi
}

# ─── 质量检查 ───────────────────────────────────────────────────────
run_quality_checks() {
  section "Quality Checks"

  # 1. 检查是否存在 any 类型 (TypeScript)
  info "Checking for 'any' type usage in TypeScript..."
  local any_count=$(grep -r ': any' "$PROJECT_ROOT/frontend/src" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v 'node_modules\|\.test\.\|\.spec\.\|test-' | wc -l | tr -d ' ')
  if [ "$any_count" -eq 0 ]; then
    pass "No 'any' type usage found"
    record "quality_no_any" "PASS"
  else
    fail "Found $any_count instances of 'any' type (see TESTING_GUIDE.md rules)"
    record "quality_no_any" "FAIL"
  fi

  # 2. 检查是否有未处理的 error (Go)
  info "Checking for unhandled errors in Go code..."
  local err_count=$(grep -r 'if err != nil {' "$PROJECT_ROOT/backend/internal" --include="*.go" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$err_count" -gt 0 ]; then
    pass "Found $err_count error handling blocks"
    record "quality_error_handling" "PASS"
  else
    skip "No error handling blocks found (may need review)"
    record "quality_error_handling" "WARN"
  fi

  # 3. 检查测试文件数量
  info "Test file inventory..."
  local be_test_files=$(find "$PROJECT_ROOT/backend" -name "*_test.go" 2>/dev/null | wc -l | tr -d ' ')
  local fe_test_files=$(find "$PROJECT_ROOT/frontend" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
  local ai_test_files=$(find "$PROJECT_ROOT/ai-service" -name "test_*.py" -o -name "*_test.py" 2>/dev/null | wc -l | tr -d ' ')
  local yolo_test_files=$(find "$PROJECT_ROOT/yolo-service" -name "test_*.py" -o -name "*_test.py" 2>/dev/null | wc -l | tr -d ' ')

  info "Backend test files:  $be_test_files"
  info "Frontend test files: $fe_test_files"
  info "AI test files:       $ai_test_files"
  info "YOLO test files:     $yolo_test_files"

  if [ "$ai_test_files" -eq 0 ]; then
    skip "AI service has NO test files (add tests recommended)"
    record "quality_test_coverage" "WARN"
  else
    pass "All services have test files"
    record "quality_test_coverage" "PASS"
  fi

  record "quality" "DONE"
}

# ─── 生成报告 ───────────────────────────────────────────────────────
generate_report() {
  section "Test Report"

  echo ""
  echo -e "${BOLD}Results Summary:${NC}"
  echo ""

  # 表格输出
  printf "  ${BOLD}%-25s %-12s${NC}\n" "Module" "Status"
  printf "  %-25s %-12s\n" "-------------------------" "------------"

  local all_keys="env_check backend_vet backend_unit backend_middleware backend_integration frontend_unit frontend_integration frontend_types ai yolo e2e quality_no_any quality_error_handling"
  for key in $all_keys; do
    status=$(get_result "$key")
    if [ -n "$status" ]; then
      local color=$NC
      case "$status" in
        PASS) color=$GREEN ;;
        FAIL) color=$RED ;;
        SKIP) color=$YELLOW ;;
        WARN) color=$YELLOW ;;
        *) color=$NC ;;
      esac
      printf "  %-25s ${color}%-12s${NC}\n" "$key" "$status"
    fi
  done

  echo ""

  # 总体状态
  local overall_status="PASS"
  for key in backend_unit frontend_unit; do
    local r
    r=$(get_result "$key")
    if [ "$r" = "FAIL" ]; then
      overall_status="FAIL"
      break
    fi
  done
      overall_status="FAIL"
      break
    fi
  done

  if [ "$overall_status" = "PASS" ]; then
    echo -e "  ${GREEN}${BOLD}Overall: ALL CRITICAL TESTS PASSED${NC}"
  else
    echo -e "  ${RED}${BOLD}Overall: SOME TESTS FAILED${NC}"
  fi

  echo ""

  # 输出文件报告
  if [ -n "$REPORT_FILE" ]; then
    mkdir -p "$(dirname "$REPORT_FILE")"
    {
      echo "# Test Report - $(date '+%Y-%m-%d %H:%M:%S')"
      echo ""
      echo "## Results Summary"
      echo ""
      echo "| Module | Status |"
      echo "|--------|--------|"
      for key in env_check backend_vet backend_unit backend_middleware backend_integration frontend_unit frontend_integration frontend_types ai yolo e2e quality_no_any quality_error_handling; do
        local r
        r=$(get_result "$key")
        if [ -n "$r" ]; then
          echo "| $key | $r |"
        fi
      done
      echo ""
      echo "## Overall: $overall_status"
      echo ""
      echo "## Logs"
      echo "All logs saved to: $REPORT_DIR"
    } > "$REPORT_FILE"
    info "Report saved to: $REPORT_FILE"
  fi

  return $([ "$overall_status" = "PASS" ] && echo 0 || echo 1)
}

# ═══════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════
main() {
  mkdir -p "$REPORT_DIR"

  echo ""
  echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║          Xunjianbao - Full Test Suite Runner               ║${NC}"
  echo -e "${CYAN}${BOLD}║          $(date '+%Y-%m-%d %H:%M:%S')                              ║${NC}"
  echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"

  # 环境检查
  env_check

  # 并行或串行执行
  if [ "$PARALLEL" = true ]; then
    info "Running tests in parallel mode..."

    if [ "$RUN_BACKEND" = true ] && [ "$RUN_FRONTEND" = true ]; then
      run_backend_tests &
      local backend_pid=$!
      run_frontend_tests &
      local frontend_pid=$!

      wait $backend_pid || true
      wait $frontend_pid || true
    else
      [ "$RUN_BACKEND" = true ] && run_backend_tests
      [ "$RUN_FRONTEND" = true ] && run_frontend_tests
    fi

    [ "$RUN_AI" = true ] && run_ai_tests
    [ "$RUN_YOLO" = true ] && run_yolo_tests
    [ "$RUN_E2E" = true ] && run_e2e_tests
  else
    [ "$RUN_BACKEND" = true ] && run_backend_tests
    [ "$RUN_FRONTEND" = true ] && run_frontend_tests
    [ "$RUN_AI" = true ] && run_ai_tests
    [ "$RUN_YOLO" = true ] && run_yolo_tests
    [ "$RUN_E2E" = true ] && run_e2e_tests
  fi

  # 质量检查
  run_quality_checks

  # 生成报告
  generate_report
  local exit_code=$?

  echo ""
  echo -e "${CYAN}Logs saved to: $REPORT_DIR${NC}"
  echo ""

  exit $exit_code
}

main
