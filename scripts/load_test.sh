#!/bin/bash

# 巡检宝性能负载测试脚本
# 使用方法: ./scripts/load_test.sh [base_url] [concurrent_users] [duration]

BASE_URL=${1:-"http://localhost:8094"}
CONCURRENT_USERS=${2:-10}
DURATION=${3:-30s}

echo "=========================================="
echo "巡检宝性能负载测试"
echo "=========================================="
echo "目标URL: $BASE_URL"
echo "并发用户: $CONCURRENT_USERS"
echo "测试时长: $DURATION"
echo "=========================================="

# 检查 k6 是否安装
if ! command -v k6 &> /dev/null; then
    echo "错误: 需要安装 k6 (https://k6.io/docs/getting-started/installation/)"
    echo "MacOS: brew install k6"
    echo "Linux: 参见 https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# 创建临时测试文件
TEMP_TEST_FILE=$(mktemp /tmp/xunjianbao_load_test_XXXXXX.js)

cat > "$TEMP_TEST_FILE" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: $CONCURRENT_USERS },  // 斜坡上升
    { duration: '$DURATION', target: $CONCURRENT_USERS },  // 保持稳定
    { duration: '10s', target: 0 },  // 斜坡下降
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%的请求应在500ms内完成
    http_req_failed: ['rate<0.05'],    // 错误率应小于5%
    errors: ['rate<0.1'],              // 自定义错误率小于10%
  },
};

const BASE_URL = '$BASE_URL';

export default function () {
  // 测试健康检查
  const healthCheck = http.get(\`\${BASE_URL}/health\`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1);
}
EOF

echo ""
echo "开始负载测试..."
echo ""

# 运行 k6 测试
k6 run "$TEMP_TEST_FILE"

# 清理临时文件
rm -f "$TEMP_TEST_FILE"

echo ""
echo "=========================================="
echo "负载测试完成"
echo "=========================================="
