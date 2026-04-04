# 巡检宝 - AI智能规范

> **合并版本**: ai_detection + anti_hallucination
> **版本**: v2.0.0
> **更新日期**: 2026-04-04

---

本文件整合了以下两个规范：
1. `ai_detection_rules.md` - YOLO检测规范
2. `anti_hallucination_rules.md` - 幻觉防控规范

---

## 第一部分：YOLO检测规范

### 1.1 模型管理

#### 模型版本控制
```yaml
模型存储:
  路径: /models/{model_name}/{version}/
  命名: yolov8-fire-v1.0.0.onnx

版本策略:
  - 生产环境只能使用稳定版
  - 模型文件存储在对象存储
  - 服务启动时自动拉取
  - 支持热更新，不重启切换
```

#### 模型加载
```python
# ✅ 模型管理器
class ModelManager:
    def __init__(self):
        self.models = {}
        self.current_version = {}

    def load_model(self, name: str, version: str):
        """加载模型"""
        path = f"/models/{name}/{version}/model.onnx"

        if torch.cuda.is_available():
            model = torch.hub.load('ultralytics/yolov8', name)
            model = torch.compile(model)
        else:
            model = YOLO(path)

        self.models[f"{name}:{version}"] = model
        self.current_version[name] = version
        return model

    def get_model(self, name: str):
        """获取当前版本模型"""
        version = self.current_version.get(name)
        return self.models.get(f"{name}:{version}")
```

### 1.2 检测策略

#### 检测配置
```python
DETECTION_CONFIG = {
    # 置信度阈值
    'confidence_threshold': 0.5,

    # NMS阈值
    'nms_threshold': 0.45,

    # 输入尺寸
    'input_size': (640, 640),

    # 防抖：连续N帧检测到才触发
    'debounce_frames': 3,

    # 感兴趣区域(ROI)
    'roi': {
        'enabled': True,
        'regions': [{'x': 100, 'y': 100, 'w': 400, 'h': 300}]
    }
}
```

### 1.3 检测类型

```yaml
支持的检测类型:
  火灾检测: yolov8-fire
  入侵检测: yolov8-intrusion
  裂缝检测: yolov8-crack
  烟雾检测: yolov8-smoke
  车辆检测: yolov8-vehicle
```

---

## 第二部分：AI幻觉防控规范

### 2.1 什么是 AI 幻觉？

AI 幻觉就像考试时遇到完全不会的题目，你选择了"蒙一个"而不是"空着"。只不过 AI 蒙得更专业——它会用非常自信的语气，给你编造一个听起来完全合理但实际上是胡扯的答案。

#### 典型幻觉案例
```yaml
# ❌ 幻觉现场
用户: "项目用的什么加密算法？"
Agent: "项目使用 bcrypt 加密"

# ✅ 实际情况
项目使用 argon2 加密，根本没有 bcrypt
```

### 2.2 绝对禁止清单

```yaml
🚫 严格禁止行为:

1. 凭空捏造
   - 文件路径（除非已读取确认）
   - 函数名/方法名（除非已搜索确认）
   - API端点（除非已查看路由确认）
   - 配置项名称（除非已查看配置确认）

2. 过度自信
   - 使用"肯定是"、"一定是"
   - 在不确定时给出绝对性结论
   - 省略"可能"、"或许"等限定词

3. 闭眼瞎猜
   - 不查看代码就描述代码结构
   - 不查看文档就描述API
   - 不查看配置就描述配置项
```

### 2.3 必须遵守清单

```yaml
✅ 必须行为:

1. 事实核查
   - 提供文件路径 → 必须读取文件确认存在
   - 提供函数名 → 必须搜索代码库确认
   - 提供API → 必须查看路由定义或文档
   - 提供配置 → 必须查看配置文件或文档

2. 明确声明
   - 不确定时 → "我不确定，需要验证"
   - 多选一时 → "可能是A或B，建议验证"
   - 超出范围 → "这个问题我无法确定"

3. 主动验证
   - 回复前检查清单
   - 引用代码时标注文件位置和行号
   - 描述API时标注来源文档
```

### 2.4 回复前检查清单

**每个回复都要过一遍这关**：

```yaml
□ 我引用的文件真的存在吗？
  → 如果不确定，立刻读取文件验证

□ 我说的函数名真的在代码库里吗？
  → 如果不确定，立刻搜索代码库

□ 我描述的API真的存在吗？
  → 如果不确定，立刻查看路由定义

□ 我说的配置项真的在配置里吗？
  → 如果不确定，立刻查看配置文件
```

### 2.5 正确的表达方式

#### ❌ 错误示例
```yaml
"这个函数在 utils/helper.ts:45"
"项目使用 bcrypt 加密"
"API在 /api/v1/users"
```

#### ✅ 正确示例
```yaml
"根据我读取的 utils/helper.ts 文件，函数在第45行"
"我需要查看配置才能确认加密算法"
"根据项目路由定义，API端点是 /api/v1/users"
```

---

## 第三部分：知识库管理

### 3.1 知识库构建

```yaml
知识来源:
  - 项目文档 (README, API docs)
  - 代码注释
  - 架构设计文档
  - API文档
  - 数据库Schema

知识更新:
  - 新功能发布时更新
  - 架构变更时更新
  - API变更时更新
```

### 3.2 RAG系统

```python
# 知识库RAG服务
class KnowledgeBaseRAGService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embeddings = Embeddings()

    async def add_document(self, doc: str, metadata: dict):
        """添加文档到知识库"""
        chunks = self.chunk_text(doc)
        embeddings = self.embeddings.encode(chunks)
        self.vector_store.add(embeddings, metadata)

    async def search(self, query: str, top_k: int = 5):
        """语义搜索"""
        query_embedding = self.embeddings.encode([query])
        results = self.vector_store.search(query_embedding, top_k)
        return results
```

---

## 第四部分：OpenClaw集成

### 4.1 OpenClaw配置

```yaml
OpenClaw:
  用途:
    - AI对话
    - 报告生成
    - 故障诊断
    - 智能推荐

  配置:
    - API端点: /api/v1/openclaw
    - 模型: gpt-4
    - 温度: 0.7
    - 最大Token: 2000
```

### 4.2 OpenClaw工具开发

```typescript
// 工具定义示例
const tools = [
  {
    name: 'search_code',
    description: '搜索代码库中的函数或变量',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '搜索模式' },
        file: { type: 'string', description: '文件路径' }
      }
    }
  },
  {
    name: 'read_file',
    description: '读取文件内容',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' }
      }
    }
  }
];
```

---

## 第五部分：禁止事项

```yaml
🚫 AI检测禁止:
- 模型未经测试直接上线
- 忽略误报和漏报
- 不设置置信度阈值
- 不实现防抖机制

🚫 幻觉禁止:
- 凭空捏造文件路径
- 不经验证就描述API
- 不查看代码就下结论
- 使用"肯定"、"一定"等绝对词

✅ 正确行为:
- 引用代码必须标注文件和行号
- 不确定时明确说"需要验证"
- 提供多个可能时说明概率
- 超范围时承认不知道
```

---

## 📚 关联规范

- [CORE_RULES.md](CORE_RULES.md) - 核心规则
- [project_rules.md](project_rules.md) - 项目规则
- [security_rules.md](security_rules.md) - 安全规则

---

**最后更新**: 2026-04-04
**版本**: v2.0.0
**合并来源**:
- ai_detection_rules.md
- anti_hallucination_rules.md
