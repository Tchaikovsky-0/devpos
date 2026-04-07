# OpenClaw深度融合 - 集成完成总结

## 🎉 集成状态

### ✅ 已完成的集成工作

| 模块 | 状态 | 说明 |
|------|------|------|
| **后端路由** | ✅ 完成 | 所有AI功能API已注册到路由系统 |
| **前端API** | ✅ 完成 | 创建了完整的API调用封装 |
| **数据模型** | ✅ 完成 | 所有数据模型已创建 |
| **处理器** | ✅ 完成 | 所有API处理器已实现 |

---

## 📡 API端点清单

### 设备健康预测

```
GET  /api/v1/ai/predict-health              # 获取所有设备健康预测
GET  /api/v1/ai/predict-health/:device_id   # 获取单个设备健康预测
GET  /api/v1/ai/health-report               # 获取设备健康报告
POST /api/v1/ai/predict-health/refresh      # 刷新健康预测
```

### 告警分析

```
POST /api/v1/ai/analyze-alert/:alert_id     # 分析单个告警
POST /api/v1/ai/analyze-alerts/batch        # 批量分析告警
GET  /api/v1/ai/alert-analysis/:alert_id    # 获取告警分析结果
```

### 设备诊断

```
POST /api/v1/ai/diagnose-device/:device_id  # 诊断设备故障
GET  /api/v1/ai/diagnosis-history/:device_id # 获取诊断历史
POST /api/v1/ai/auto-fix/:device_id         # 自动修复设备
```

---

## 🚀 使用示例

### 1. 设备健康预测

#### 前端调用示例

```typescript
import { aiApi } from '@/api/v1/ai';

// 获取所有设备的健康预测
const predictions = await aiApi.getHealthPredictions();

// 获取单个设备的健康预测
const prediction = await aiApi.getDeviceHealthPrediction('CAM-001');

// 获取健康报告
const report = await aiApi.getHealthReport();

// 刷新健康预测
await aiApi.refreshHealthPredictions({ device_id: 'CAM-001' });
```

#### 后端调用示例

```bash
# 获取所有设备健康预测
curl -X GET "http://localhost:8080/api/v1/ai/predict-health" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取单个设备健康预测
curl -X GET "http://localhost:8080/api/v1/ai/predict-health/CAM-001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取健康报告
curl -X GET "http://localhost:8080/api/v1/ai/health-report" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 刷新健康预测
curl -X POST "http://localhost:8080/api/v1/ai/predict-health/refresh" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. 告警分析

#### 前端调用示例

```typescript
import { aiApi } from '@/api/v1/ai';

// 分析单个告警
const analysis = await aiApi.analyzeAlert('ALT-001');

// 批量分析告警
const analyses = await aiApi.batchAnalyzeAlerts(['ALT-001', 'ALT-002', 'ALT-003']);

// 获取告警分析结果
const result = await aiApi.getAlertAnalysis('ALT-001');
```

#### 后端调用示例

```bash
# 分析单个告警
curl -X POST "http://localhost:8080/api/v1/ai/analyze-alert/ALT-001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 批量分析告警
curl -X POST "http://localhost:8080/api/v1/ai/analyze-alerts/batch" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["ALT-001", "ALT-002", "ALT-003"]'

# 获取告警分析结果
curl -X GET "http://localhost:8080/api/v1/ai/alert-analysis/ALT-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. 设备诊断

#### 前端调用示例

```typescript
import { aiApi } from '@/api/v1/ai';

// 诊断设备
const diagnosis = await aiApi.diagnoseDevice('CAM-001');

// 获取诊断历史
const history = await aiApi.getDiagnosisHistory('CAM-001');

// 自动修复设备
const result = await aiApi.autoFix('CAM-001');
```

#### 后端调用示例

```bash
# 诊断设备
curl -X POST "http://localhost:8080/api/v1/ai/diagnose-device/CAM-001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取诊断历史
curl -X GET "http://localhost:8080/api/v1/ai/diagnosis-history/CAM-001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 自动修复设备
curl -X POST "http://localhost:8080/api/v1/ai/auto-fix/CAM-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 数据结构

### DeviceHealthPrediction

```typescript
interface DeviceHealthPrediction {
  device_id: string;                      // 设备ID
  device_name: string;                    // 设备名称
  current_health_score: number;           // 当前健康评分 (0-100)
  predicted_health_score: number;         // 预测健康评分 (0-100)
  failure_probability: number;            // 故障概率 (0-1)
  predicted_failure_time?: string;        // 预测故障时间
  predicted_failure_time_string: string;  // 预测故障时间（字符串格式）
  status: 'healthy' | 'warning' | 'critical' | 'unknown'; // 健康状态
  issues: string[];                       // 问题列表
  suggestions: string[];                  // 建议列表
  maintenance_type: string;               // 维护类型
  confidence: number;                     // 置信度 (0-1)
}
```

### AlertAnalysis

```typescript
interface AlertAnalysis {
  id: number;                             // 分析ID
  alert_id: string;                       // 告警ID
  alert_type: string;                     // 告警类型
  risk_level: 'high' | 'medium' | 'low';  // 风险等级
  risk_score: number;                     // 风险评分 (0-100)
  summary: string;                        // 摘要
  context: {                              // 上下文信息
    time: string;                         // 时间上下文
    weather: string;                      // 天气上下文
    location: string;                     // 位置上下文
    history: string;                      // 历史上下文
  };
  suggestions: Array<{                    // 处置建议
    priority: number;                     // 优先级
    action: string;                       // 行动描述
    responsible: string;                  // 负责人
    estimated_time: string;               // 预计时间
    contact: string;                      // 联系方式
  }>;
  related_alerts: Array<{                 // 相关告警
    alert_id: string;                     // 告警ID
    relationship: string;                 // 关联关系
  }>;
  auto_actions: string[];                 // 自动执行的操作
  created_at: string;                     // 创建时间
}
```

### DeviceDiagnosis

```typescript
interface DeviceDiagnosis {
  id: number;                             // 诊断ID
  device_id: string;                      // 设备ID
  device_name: string;                    // 设备名称
  device_type: string;                    // 设备类型
  issue_type: string;                     // 问题类型
  diagnosis_status: 'success' | 'failed' | 'partial'; // 诊断状态
  root_cause: {                           // 根本原因
    category: string;                     // 类别
    description: string;                  // 描述
    confidence: number;                   // 置信度
    evidence: string[];                   // 证据
  };
  diagnosis_process: Array<{              // 诊断过程
    step: number;                         // 步骤编号
    name: string;                         // 步骤名称
    status: 'passed' | 'failed' | 'warning'; // 步骤状态
    details: string;                      // 详细信息
    duration: string;                     // 耗时
  }>;
  solutions: Array<{                      // 解决方案
    priority: number;                     // 优先级
    type: 'auto' | 'manual' | 'professional'; // 方案类型
    action: string;                       // 行动描述
    description: string;                  // 详细描述
    estimated_time: string;               // 预计时间
    success_rate: number;                 // 成功率
    auto_fix_available: boolean;          // 是否可自动修复
    auto_fix_command?: string;            // 自动修复命令
    steps?: string[];                     // 手动修复步骤
  }>;
  related_issues: Array<{                 // 相关问题
    issue: string;                        // 问题名称
    impact: string;                       // 影响
    suggestion: string;                   // 建议
  }>;
  preventive_measures: string[];          // 预防措施
  diagnosis_time: string;                 // 诊断时间
  duration: string;                       // 诊断耗时
}
```

---

## 🎯 集成到现有页面

### 1. 在设备列表中显示健康度

```typescript
import { aiApi } from '@/api/v1/ai';
import { useQuery } from '@tanstack/react-query';

function DeviceList() {
  const { data: predictions } = useQuery({
    queryKey: ['device-health-predictions'],
    queryFn: aiApi.getHealthPredictions,
    refetchInterval: 60000, // 每分钟刷新
  });

  return (
    <div>
      {predictions?.map(prediction => (
        <div key={prediction.device_id}>
          <h3>{prediction.device_name}</h3>
          <div>健康度: {prediction.current_health_score}</div>
          <div>状态: {prediction.status}</div>
          <div>故障概率: {(prediction.failure_probability * 100).toFixed(1)}%</div>
        </div>
      ))}
    </div>
  );
}
```

### 2. 在告警详情中显示AI分析

```typescript
import { aiApi } from '@/api/v1/ai';
import { useQuery } from '@tanstack/react-query';

function AlertDetail({ alertId }: { alertId: string }) {
  const { data: analysis } = useQuery({
    queryKey: ['alert-analysis', alertId],
    queryFn: () => aiApi.analyzeAlert(alertId),
  });

  if (!analysis) return <div>分析中...</div>;

  return (
    <div>
      <h2>告警分析</h2>
      <div>风险等级: {analysis.risk_level}</div>
      <div>风险评分: {analysis.risk_score}</div>
      <div>摘要: {analysis.summary}</div>
      
      <h3>处置建议</h3>
      {analysis.suggestions.map((suggestion, index) => (
        <div key={index}>
          <div>优先级: {suggestion.priority}</div>
          <div>行动: {suggestion.action}</div>
          <div>负责人: {suggestion.responsible}</div>
          <div>预计时间: {suggestion.estimated_time}</div>
        </div>
      ))}
    </div>
  );
}
```

### 3. 在设备详情中显示诊断结果

```typescript
import { aiApi } from '@/api/v1/ai';
import { useMutation } from '@tanstack/react-query';

function DeviceDetail({ deviceId }: { deviceId: string }) {
  const diagnoseMutation = useMutation({
    mutationFn: () => aiApi.diagnoseDevice(deviceId),
  });

  const autoFixMutation = useMutation({
    mutationFn: () => aiApi.autoFix(deviceId),
  });

  return (
    <div>
      <button onClick={() => diagnoseMutation.mutate()}>
        诊断设备
      </button>
      
      {diagnoseMutation.data && (
        <div>
          <h2>诊断结果</h2>
          <div>诊断状态: {diagnoseMutation.data.diagnosis_status}</div>
          <div>根本原因: {diagnoseMutation.data.root_cause.description}</div>
          
          <h3>解决方案</h3>
          {diagnoseMutation.data.solutions.map((solution, index) => (
            <div key={index}>
              <div>优先级: {solution.priority}</div>
              <div>行动: {solution.action}</div>
              <div>成功率: {(solution.success_rate * 100).toFixed(0)}%</div>
              
              {solution.auto_fix_available && (
                <button onClick={() => autoFixMutation.mutate()}>
                  自动修复
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 配置说明

### 后端配置

确保数据库中已创建以下表：

```sql
-- 设备健康评分表
CREATE TABLE device_health_scores (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64),
    device_name VARCHAR(255),
    tenant_id VARCHAR(64),
    health_score DECIMAL(5,2),
    status VARCHAR(32),
    offline_count INTEGER,
    error_count INTEGER,
    issue_type VARCHAR(128),
    predicted_failure_probability DECIMAL(5,2),
    predicted_failure_time TIMESTAMP,
    suggestion TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 告警分析表
CREATE TABLE alert_analyses (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(64),
    alert_type VARCHAR(128),
    risk_level VARCHAR(32),
    risk_score INTEGER,
    summary VARCHAR(255),
    context JSONB,
    suggestions JSONB,
    related_alerts JSONB,
    auto_actions JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 设备诊断表
CREATE TABLE device_diagnoses (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64),
    device_name VARCHAR(255),
    device_type VARCHAR(64),
    issue_type VARCHAR(128),
    diagnosis_status VARCHAR(32),
    root_cause JSONB,
    diagnosis_process JSONB,
    solutions JSONB,
    related_issues JSONB,
    preventive_measures JSONB,
    diagnosis_time TIMESTAMP,
    duration VARCHAR(32),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 前端配置

确保已安装必要的依赖：

```bash
pnpm add @tanstack/react-query
```

在应用入口配置React Query：

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 你的应用 */}
    </QueryClientProvider>
  );
}
```

---

## 🎊 集成完成！

**所有AI功能已成功集成到巡检宝系统中！**

### ✅ 已完成的工作

1. **后端集成**
   - ✅ 所有AI功能API已注册到路由系统
   - ✅ 所有处理器已创建并初始化
   - ✅ 所有数据模型已定义

2. **前端集成**
   - ✅ 创建了完整的API调用封装
   - ✅ 导出了所有类型定义
   - ✅ 提供了使用示例

3. **文档完善**
   - ✅ API端点清单
   - ✅ 数据结构说明
   - ✅ 使用示例代码
   - ✅ 集成指南

### 🚀 下一步

1. **启动服务**
   ```bash
   # 后端
   cd backend
   go run cmd/server/main.go
   
   # 前端
   cd frontend
   pnpm dev
   ```

2. **测试API**
   - 使用Postman或curl测试API端点
   - 检查响应数据格式是否正确

3. **开发UI组件**
   - 根据提供的示例代码开发UI组件
   - 集成到现有页面中

---

**集成完成时间**: 2026年4月
**版本**: v1.0.0
