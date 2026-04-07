# 巡检宝

面向重工业企业的智能监控平台，通过 OpenClaw AI Agent 和 YOLO 检测，让监控从"被动观看"升级为"主动思考"。

## 核心功能

- **数据大屏**: 多画面视频流实时监控
- **媒体库**: 企业级文件存储、权限管理
- **视频流接入**: 大疆司空2、RTSP、WebRTC、HLS
- **YOLO检测**: 火灾、裂缝、入侵、车辆识别
- **OpenClaw**: AI对话、报告生成、故障诊断
- **告警管理**: 告警规则、实时推送、处理流程

## 技术架构

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind + Vite + pnpm |
| 后端 | Go 1.21+ + Gin + MySQL + Redis + GORM + JWT |
| AI服务 | Python 3.10+ + FastAPI + YOLOv8 + OpenCV |

## 快速开始

### 🚀 开发环境（推荐）

**一键启动全链路热加载环境：**

```bash
# 1. 克隆项目
git clone <repo-url>
cd xunjianbao

# 2. 复制环境变量配置
cp .env.example .env

# 3. 一键启动（前后端热加载）
./dev-start.sh
```

访问地址：
- **前端**: http://localhost:3000
- **后端**: http://localhost:8094

**🔓 开发模式特性：**
- ✅ 无需登录即可访问所有页面
- ✅ API 无需 token 认证
- ✅ 自动注入开发用户信息

查看 [快速启动指南](./DEV_QUICKSTART.md) 或 [认证配置说明](./DEV_AUTH_BYPASS.md) 了解更多。

---

### 📦 生产部署

```bash
# 使用 Docker Compose 部署
docker-compose up -d
```

---

### 🔧 手动开发（可选）

<details>
<summary>点击展开手动配置步骤</summary>

#### 环境要求

- Node.js >= 18.0.0
- Go >= 1.21.0
- Python >= 3.10.0
- MySQL 8.0+
- Redis 7.0+

#### 手动启动

```bash
# 1. 克隆项目
git clone <repo-url>
cd xunjianbao

# 2. 启动后端
cd backend
go mod download
go run cmd/server/main.go

# 3. 启动前端
cd frontend
pnpm install
pnpm dev

# 4. 启动 AI 服务 (可选)
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8095
```

### Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 服务端口

| 服务 | 端口 |
|------|------|
| 前端 | 3000/5173 |
| Go服务 | 8094 |
| Python AI服务 | 8095 |
| MySQL | 3306 |
| Redis | 6379 |

## 项目结构

```
xunjianbao/
├── frontend/          # React 前端
├── backend/          # Go 后端
├── ai-service/       # Python AI 服务
├── deploy/           # 部署配置
├── docker-compose.yaml
└── README.md
```

## License

ISC
