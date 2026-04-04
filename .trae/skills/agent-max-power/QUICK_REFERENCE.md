# 🚀 Agent最大功率运行 - 快速参考卡

> **巡检宝项目性能优化核心规则速查**
> 完整规范请查看：[SKILL.md](./SKILL.md)

---

## 🎯 性能最大化七武器

```
┌──────────────────────────────────────────────────────┐
│  ⚡ 并行处理    同时做多件事                          │
│  💾 缓存复用    读一次用多次                          │
│  📦 批量处理    合并小任务成大任务                    │
│  🔮 预计算      提前准备好可能要用的                  │
│  📊 智能调度    把任务给最合适的执行者                 │
│  🌊 流式处理    边处理边输出                          │
│  🎯 自适应优化  根据情况动态调整                       │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 性能提升目标

```yaml
📊 最低目标：提升 50%
   - 基础缓存
   - 简单并行

📊 标准目标：提升 200%
   - 完整缓存
   - 智能并行
   - 批量处理

📊 极致目标：提升 500%+
   - 全方位优化
   - 预测加载
   - 自适应策略
```

---

## ⚡ 并行处理

### 什么时候并行？

```yaml
✅ 应该并行：
   - 多个独立任务
   - IO密集型操作
   - 多个API调用
   - 文件读取

❌ 应该串行：
   - 有依赖关系的任务
   - CPU密集型（有锁）
   - 需要共享资源
```

### 代码模板

```python
# ✅ 并行执行
results = await asyncio.gather(
    task_a(),
    task_b(),
    task_c()
)

# ❌ 串行执行（慢）
result1 = await task_a()
result2 = await task_b()
result3 = await task_c()
```

---

## 💾 缓存复用

### 缓存策略

```yaml
缓存原则：
   - 读一次用多次
   - 缓存命中率 > 50%
   - 定期清理过期缓存

缓存级别：
   - L1: 内存缓存（最快）
   - L2: 本地磁盘缓存
   - L3: 远程缓存（Redis）
```

### 代码模板

```python
# ✅ 使用缓存
class CacheManager:
    def get_or_compute(self, key, compute_func):
        if key not in self.cache:
            self.cache[key] = compute_func()
        return self.cache[key]

# ❌ 不用缓存（重复计算）
for i in range(10):
    data = compute()  # 重复计算10次！
```

---

## 📦 批量处理

### 批量 vs 逐个

```yaml
批量处理：
   - ✅ 合并N次操作为1次
   - ✅ 减少系统调用开销
   - ✅ 提高吞吐量

适用场景：
   - 数据库批量查询
   - API批量调用
   - 文件批量读写
```

### 代码模板

```python
# ✅ 批量查询
users = db.query("SELECT * FROM users WHERE id IN (?)", user_ids)

# ❌ 逐个查询（N+1问题）
for user_id in user_ids:
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
```

---

## 🔮 预计算与预加载

### 预加载策略

```yaml
预加载时机：
   - 当前任务快完成时
   - 识别到常见模式
   - 资源空闲时

预加载内容：
   - 下一个任务可能需要的文件
   - 下一个任务可能需要的API
   - 预测需要的数据
```

### 代码模板

```python
# ✅ 预加载
async def execute_task(task):
    result = await do_current_task(task)
    next_step = predict_next_step(task)
    asyncio.create_task(preload(next_step))  # 后台预加载
    return result

# ❌ 不预加载
result = await do_current_task(task)
result = await do_next_task(task)  # 等待
```

---

## 📊 智能调度

### 调度策略

```yaml
优先级调度：
   - 重要任务先做
   - 紧急任务先做

最短作业优先：
   - 快任务先完成
   - 减少平均等待时间

负载均衡：
   - 均匀分配任务
   - 避免单点瓶颈
```

### 代码模板

```python
# ✅ 优先级队列
task_queue.sort(key=lambda t: t.priority, reverse=True)

# ✅ 负载均衡
for worker in workers:
    if worker.is_idle():
        worker.assign(task_queue.pop(0))
```

---

## 🌊 流式处理

### 流式 vs 批处理

```yaml
流式处理：
   - ✅ 边处理边输出
   - ✅ 响应更快
   - ✅ 内存占用低

适用场景：
   - 大文件处理
   - 实时响应
   - 长任务监控
```

### 代码模板

```python
# ✅ 流式处理
async def stream_process(data):
    for item in data:
        result = process(item)
        yield result  # 处理一个输出一个

# ❌ 批处理（等全部完成）
results = [process(item) for item in data]
```

---

## 🎯 自适应优化

### 监控指标

```yaml
性能指标：
   - 响应时间
   - 吞吐量
   - 错误率
   - 缓存命中率

异常检测：
   - 性能下降
   - 错误增加
   - 资源耗尽
```

### 代码模板

```python
# ✅ 自适应策略
if metrics['error_rate'] > 0.1:
    enable_retry()
if metrics['avg_response_time'] > 1000:
    enable_cache()
```

---

## 🔧 最大功率五步法

```
┌────────────────────────────────────────────┐
│  1️⃣ 任务分析                              │
│     - 任务分解                             │
│     - 依赖分析                             │
│     - 资源评估                             │
│                                            │
│  2️⃣ 策略规划                              │
│     - 选择优化策略                         │
│     - 制定执行计划                         │
│     - 设置监控指标                         │
│                                            │
│  3️⃣ 并行执行                              │
│     - 启动并行任务                         │
│     - 监控执行状态                         │
│     - 动态调整                             │
│                                            │
│  4️⃣ 实时监控                              │
│     - 性能指标监控                         │
│     - 异常检测                             │
│     - 告警通知                             │
│                                            │
│  5️⃣ 持续优化                              │
│     - 结果分析                             │
│     - 瓶颈识别                             │
│     - 改进迭代                             │
└────────────────────────────────────────────┘
```

---

## 🚫 性能优化禁止

```yaml
绝对禁止：

❌ 过度优化：
   - 优化不常用的代码
   - 牺牲可读性换性能

❌ 盲目并行：
   - 并行有依赖的任务
   - 并行CPU密集型任务

❌ 无缓存策略：
   - 重复计算相同结果
   - 重复读取相同文件

❌ 无监控：
   - 不测量就优化
   - 不监控就上线
```

---

## 📊 性能基准

```yaml
基准指标：

响应时间：
   - 快速：< 100ms
   - 正常：100-500ms
   - 可接受：500-1000ms
   - 慢：> 1000ms

吞吐量：
   - 低：< 10 QPS
   - 中：10-100 QPS
   - 高：100-1000 QPS
   - 极高：> 1000 QPS

错误率：
   - 优秀：< 0.1%
   - 良好：< 1%
   - 可接受：< 5%
   - 差：> 5%
```

---

## 🔍 性能问题自检

```
遇到性能问题时的检查清单：

□ 是否可以并行化？
   → 是：使用并行处理
   → 否：继续

□ 是否有重复计算？
   → 是：启用缓存
   → 否：继续

□ 是否可以批量处理？
   → 是：合并请求
   → 否：继续

□ 是否有IO等待？
   → 是：异步处理
   → 否：继续

□ 是否需要预加载？
   → 是：后台预加载
   → 否：按需加载
```

---

## 📈 性能调优心法

```
1️⃣ 测量先行
   不测量就优化 = 瞎子摸象

2️⃣ 二八法则
   80%时间花在20%代码上

3️⃣ 缓存为王
   最快的IO是不IO

4️⃣ 并行化思维
   串行是敌人

5️⃣ 批量处理
   合并减少开销

6️⃣ 异步为王
   等待时做别的事

7️⃣ 限流保护
   保护系统不被冲垮

8️⃣ 监控告警
   看不见就管不了
```

---

## ⏱️ 超时配置

```yaml
超时设置建议：

🔴 紧急任务：
   - 单次操作：30秒
   - 整体任务：5分钟

🟡 常规任务：
   - 单次操作：1分钟
   - 整体任务：15分钟

🟢 探索任务：
   - 单次操作：3分钟
   - 整体任务：30分钟
```

---

## 🛠️ 常用工具

```bash
# 性能测试
max-power benchmark --task <name>

# 性能分析
max-power profile --output <file>

# 监控仪表盘
max-power monitor --port 8080

# 优化建议
max-power suggest --task <name>

# 启用优化
max-power enable --strategy <strategy>
```

---

## 🎯 成功标准

```
✅ 性能提升 50%+（最低标准）
✅ 无明显性能问题
✅ 响应时间在可接受范围
✅ 吞吐量达标
✅ 错误率 < 1%
✅ 资源使用合理
```

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**性能大师**: Agent Max Power Expert 🤖

---

**🎉 记住**：
性能就是生命，优化永无止境！ 🚀
