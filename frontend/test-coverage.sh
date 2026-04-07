#!/bin/bash

# Test Coverage Report Generator for Xunjianbao Frontend
# Generates detailed HTML and JSON coverage reports

set -e

COVERAGE_DIR="coverage"
COVERAGE_JSON="$COVERAGE_DIR/coverage-final.json"
REPORT_HTML="$COVERAGE_DIR/lcov-report/index.html"

echo "========================================"
echo "Xunjianbao Frontend - Coverage Report"
echo "========================================"

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

# Run tests with coverage
echo ""
echo "Running tests with coverage..."
pnpm test:run --coverage --coverage.reporter=json --coverage.reporter=text --coverage.reporter=html

# Check if coverage was generated
if [ ! -f "$COVERAGE_JSON" ]; then
  echo "❌ Error: Coverage file not generated"
  exit 1
fi

# Calculate coverage metrics
echo ""
echo "========================================"
echo "Coverage Summary"
echo "========================================"

# Extract coverage metrics
LINES=$(cat "$COVERAGE_JSON" | jq '.total.lines')
LINES_PCT=$(echo "$LINES" | jq '.pct')
STATEMENTS=$(cat "$COVERAGE_JSON" | jq '.total.statements')
STATEMENTS_PCT=$(echo "$STATEMENTS" | jq '.pct')
FUNCTIONS=$(cat "$COVERAGE_JSON" | jq '.total.functions')
FUNCTIONS_PCT=$(echo "$FUNCTIONS" | jq '.pct')
BRANCHES=$(cat "$COVERAGE_JSON" | jq '.total.branches')
BRANCHES_PCT=$(echo "$BRANCHES" | jq '.pct')

echo "Lines Coverage:     ${LINES_PCT}%"
echo "Statements Coverage: ${STATEMENTS_PCT}%"
echo "Functions Coverage:  ${FUNCTIONS_PCT}%"
echo "Branches Coverage:   ${BRANCHES_PCT}%"

# List high-coverage files
echo ""
echo "========================================"
echo "High Coverage Files (>80%)"
echo "========================================"

# Get files with high coverage
cat "$COVERAGE_JSON" | jq -r '. | to_entries[] | select(.value.lines.pct > 80) | .key' | while read file; do
  FILE_COVERAGE=$(cat "$COVERAGE_JSON" | jq -r ".[\"$file\"].lines.pct")
  echo "$file: ${FILE_COVERAGE}%"
done | head -20

# Check coverage thresholds
echo ""
echo "========================================"
echo "Coverage Thresholds Check"
echo "========================================"

REQUIRED_LINES=70
REQUIRED_FUNCTIONS=80

LINES_INT=${LINES_PTR%.*}
FUNCTIONS_INT=${FUNCTIONS_PCT%.*}

if [ "$LINES_INT" -lt "$REQUIRED_LINES" ]; then
  echo "❌ FAIL: Lines coverage ($LINES_INT%) is below required threshold ($REQUIRED_LINES%)"
else
  echo "✅ PASS: Lines coverage ($LINES_INT%) meets threshold ($REQUIRED_LINES%)"
fi

if [ "$FUNCTIONS_INT" -lt "$REQUIRED_FUNCTIONS" ]; then
  echo "❌ FAIL: Functions coverage ($FUNCTIONS_INT%) is below required threshold ($REQUIRED_FUNCTIONS%)"
else
  echo "✅ PASS: Functions coverage ($FUNCTIONS_INT%) meets threshold ($REQUIRED_FUNCTIONS%)"
fi

# Generate coverage badge
echo ""
echo "========================================"
echo "Coverage Badge"
echo "========================================"

if [ "$LINES_INT" -ge 90 ]; then
  echo "🟢 Excellent: ${LINES_INT}%"
elif [ "$LINES_INT" -ge 70 ]; then
  echo "🟡 Good: ${LINES_INT}%"
elif [ "$LINES_INT" -ge 50 ]; then
  echo "🟠 Warning: ${LINES_INT}%"
else
  echo "🔴 Critical: ${LINES_INT}%"
fi

echo ""
echo "========================================"
echo "Reports Generated"
echo "========================================"
echo "JSON Report: $COVERAGE_JSON"
echo "HTML Report: $REPORT_HTML"

if [ -f "$REPORT_HTML" ]; then
  echo "✅ HTML report available at: $REPORT_HTML"
else
  echo "⚠️  HTML report not found, run with --coverage.reporter=html"
fi

echo ""
echo "✅ Coverage report generation complete!"
