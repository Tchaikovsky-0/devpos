# 巡检宝 - 企业级智能监控系统

## 产品介绍

**巡检宝**（XunjianBao）是一款面向重工业、企业、国企、高校、无人机等用户的企业级智能监控平台。

### 核心特性

- 🤖 **OpenClaw深度集成** - AI Agent能力融入监控全流程
- 🎯 **YOLO智能检测** - 自动识别火灾、破损、入侵等异常
- 📡 **多源视频接入** - 支持大疆司空2、RTSP、WebRTC等
- 🔒 **企业级安全** - 多租户隔离、权限管理
- ⚡ **简洁高效** - 专业级UI/UX设计

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS
- Redux Toolkit
- FLV.js / HLS.js

### 后端
- Go + Gin
- PostgreSQL + Redis
- GORM

### AI
- OpenClaw Agent
- YOLOv8
- OpenCV

## 快速开始

### 环境要求
- Node.js 18+
- Go 1.20+
- Docker & Docker Compose

### 安装

```bash
# 克隆项目
git clone https://github.com/your-org/xunjianbao.git
cd xunjianbao

# 启动开发环境
docker-compose -f docker/docker-compose.dev.yml up -d

# 安装前端依赖
cd frontend && pnpm install

# 安装后端依赖
cd ../backend && go mod download

# 启动后端
go run main.go
```

### 访问

- 前端：http://localhost:3000
- 后端API：http://localhost:8094

## 文档

- [技术规格说明书](docs/SPEC.md)
- [API设计文档](docs/API.md)
- [数据库设计文档](docs/DB.md)
- [开发规范文档](docs/DEVELOP.md)

## License

MIT License