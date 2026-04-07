#!/bin/bash

# Test Coverage Report Generator for Xunjianbao Backend
# Generates detailed HTML and JSON coverage reports

set -e

COVERAGE_DIR="coverage"
COVERAGE_PROFILE="$COVERAGE_DIR/coverage.out"
COVERAGE_HTML="$COVERAGE_DIR/coverage.html"
COVERAGE_JSON="$COVERAGE_DIR/coverage.json"

echo "========================================"
echo "Xunjianbao Backend - Coverage Report"
echo "========================================"

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

# Run tests with coverage
echo ""
echo "Running tests with coverage..."
go test -v -race \
  -coverprofile="$COVERAGE_PROFILE" \
  -covermode=atomic \
  -coverpkg="./internal/..." \
  ./... 2>&1 | tee "$COVERAGE_DIR/test-output.log"

# Generate HTML coverage report
echo ""
echo "Generating HTML coverage report..."
go tool cover -html="$COVERAGE_PROFILE" -o="$COVERAGE_HTML"

# Generate JSON coverage report
echo ""
echo "Generating JSON coverage report..."
go tool cover -func="$COVERAGE_PROFILE" -o="$COVERAGE_DIR/coverage.func.txt"

# Parse coverage percentages
echo ""
echo "========================================"
echo "Coverage Summary"
echo "========================================"

# Calculate overall coverage
TOTAL_COVERAGE=$(go tool cover -func="$COVERAGE_PROFILE" | grep total | awk '{print $3}' | sed 's/%//')
echo "Overall Coverage: ${TOTAL_COVERAGE}%"

# List packages with coverage
echo ""
echo "Package Coverage:"
go tool cover -func="$COVERAGE_PROFILE" | grep -v "total" | while read line; do
  PACKAGE=$(echo "$line" | awk '{print $1}')
  COVERAGE=$(echo "$line" | awk '{print $3}' | sed 's/%//')
  printf "%-60s %s%%\n" "$PACKAGE" "$COVERAGE"
done

# Check coverage thresholds
echo ""
echo "========================================"
echo "Coverage Thresholds Check"
echo "========================================"

REQUIRED_COVERAGE=70

if (( $(echo "$TOTAL_COVERAGE < $REQUIRED_COVERAGE" | bc -l) )); then
  echo "❌ FAIL: Overall coverage ($TOTAL_COVERAGE%) is below required threshold ($REQUIRED_COVERAGE%)"
  exit 1
else
  echo "✅ PASS: Overall coverage ($TOTAL_COVERAGE%) meets threshold ($REQUIRED_COVERAGE%)"
fi

# Generate coverage badge (simple text-based)
echo ""
echo "========================================"
echo "Coverage Badge"
echo "========================================"

if (( $(echo "$TOTAL_COVERAGE >= 90" | bc -l) )); then
  echo "🟢 Excellent: ${TOTAL_COVERAGE}%"
elif (( $(echo "$TOTAL_COVERAGE >= 70" | bc -l) )); then
  echo "🟡 Good: ${TOTAL_COVERAGE}%"
elif (( $(echo "$TOTAL_COVERAGE >= 50" | bc -l) )); then
  echo "🟠 Warning: ${TOTAL_COVERAGE}%"
else
  echo "🔴 Critical: ${TOTAL_COVERAGE}%"
fi

echo ""
echo "========================================"
echo "Reports Generated"
echo "========================================"
echo "HTML Report: $COVERAGE_HTML"
echo "Text Report: $COVERAGE_DIR/coverage.func.txt"
echo "Coverage Profile: $COVERAGE_PROFILE"
echo "Test Output: $COVERAGE_DIR/test-output.log"

echo ""
echo "✅ Coverage report generation complete!"
