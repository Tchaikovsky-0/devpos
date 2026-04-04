package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"xunjianbao-backend/internal/config"
	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/router"
	"xunjianbao-backend/internal/service"
)

func mustEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("environment variable %s is required", key)
	}
	return value
}

func envWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func main() {
	// 1. 加载环境变量
	databaseURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")
	port := envWithDefault("PORT", "8094")

	// 2. 验证JWT密钥
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters")
	}
	middleware.SetJWTSecret(jwtSecret)

	// 3. 连接数据库
	var db *gorm.DB
	var err error

	if databaseURL != "" {
		// 使用MySQL
		db, err = gorm.Open(mysql.Open(databaseURL), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	} else {
		// 使用SQLite作为开发数据库
		db, err = gorm.Open(sqlite.Open("xunjianbao.db"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		log.Println("Using SQLite database (development mode)")
	}

	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}

	// 4. 配置连接池
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 5. 自动迁移
	db.AutoMigrate(
		&model.User{},
		&model.Stream{},
		&model.Alert{},
		&model.Report{},
		&model.YOLODetection{},
		&model.OnCallSchedule{},
		&model.OnCallReport{},
		&model.QAKnowledgeBase{},
		&model.QADocument{},
		&model.QAConversation{},
		&model.TenantConfig{},
		&model.Sensor{},
		&model.SensorData{},
		&model.Task{},
		&model.Media{},
		&model.MediaFolder{},
		&model.DefectCase{},
		&model.DefectEvidence{},
		&model.DuplicateGroup{},
		&model.ReportDraft{},
	)

	// 6. 创建默认管理员用户
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count == 0 {
		hashedPassword, _ := handler.HashPassword("admin123")
		db.Create(&model.User{
			Username:     "admin",
			Email:        "admin@example.com",
			PasswordHash: hashedPassword,
			Role:         "admin",
			TenantID:     "tenant_default",
			IsActive:     true,
		})
		log.Println("Default admin user created (username: admin, password: admin123)")
	}

	// 7. 设置Gin
	ginMode := envWithDefault("GIN_MODE", "release")
	gin.SetMode(ginMode)
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(middleware.CORS())

	// 8. 启动 WebSocket Hub
	wsHub := service.NewWebSocketHub()
	go wsHub.Run()

	// 9. 设置路由
	cfg := config.Load()
	r := router.NewRouter(engine, db, cfg, wsHub)
	r.Setup()

	// 9. 启动服务
	log.Printf("Server starting on port %s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
