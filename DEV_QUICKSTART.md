# 🚀 开发环境快速启动指南

## 一键启动全链路热加载开发环境

```bash
# 启动所有服务（前后端热加载）
./dev-start.sh
```

**就是这么简单！** 🎉

**🔓 开发模式已启用：无需登录即可访问所有页面**

---

## 🔓 认证已禁用

在开发模式下：
- ✅ **无需登录** - 直接访问所有页面
- ✅ **API 无需 token** - 所有接口直接可用
- ✅ **自动注入用户信息** - 开发环境模拟用户

查看 [认证配置说明](./DEV_AUTH_BYPASS.md) 了解详情。

---

## 访问地址

- **前端**: http://localhost:3000 （React + Vite 热加载）
- **后端**: http://localhost:8094 （Go + Air 热加载）

## 热加载特性

### ✨ 前端热加载
- 修改 `frontend/src/` 下的任何文件
- 浏览器自动更新，无需手动刷新
- Vite 极速编译

### ✨ 后端热加载
- 修改 `backend/` 下的 `.go` 文件
- Air 自动检测并重新编译运行
- 实时日志输出

---

## 常用命令

```bash
# 检查服务健康状态
./dev-health.sh

# 停止所有服务
./dev-stop.sh

# 查看日志
docker-compose -f docker-compose.dev.yaml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yaml logs -f backend
docker-compose -f docker-compose.dev.yaml logs -f frontend
```

---

## 服务端口一览

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 3000 | React + Vite |
| 后端 | 8094 | Go + Gin |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| AI | 8095 | AI 服务 |
| YOLO | 8097 | 检测服务 |

---

## 📚 详细文档

查看 [开发环境完整指南](./DEV_GUIDE.md) 了解更多：

- 环境变量配置
- 调试技巧
- 性能优化
- 常见问题解决

---

## 🎯 默认账号

系统会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **生产环境务必修改密码！**
