package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"

	// SQLite 驱动保留以备参考（已迁移至 MySQL）
	// "gorm.io/driver/sqlite"
	// _ "modernc.org/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/router"
	"xunjianbao-backend/internal/service"
	envConfig "xunjianbao-backend/pkg/config"
	"xunjianbao-backend/pkg/redis"
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

	// 2. 记录环境信息
	envConfig.LogEnvironmentInfo()

	// 3. 验证JWT密钥（仅生产环境强制要求）
	if len(jwtSecret) < 32 && !envConfig.IsDevelopment() {
		log.Fatal("JWT_SECRET must be at least 32 characters in production")
	}
	if jwtSecret != "" {
		middleware.SetJWTSecret(jwtSecret)
	}

	// 开发环境设置默认JWT密钥
	if envConfig.IsDevelopment() && jwtSecret == "" {
		log.Println("🔧 [DEV] 使用默认JWT密钥（仅用于开发）")
		middleware.SetJWTSecret("dev-secret-key-for-testing-only-do-not-use-in-prod")
	}

	// 3. 连接数据库（MySQL）
	var db *gorm.DB
	var err error

	// 构建 MySQL DSN：优先使用 DATABASE_URL，否则从独立环境变量构建
	if databaseURL == "" {
		dbHost := envWithDefault("DB_HOST", "localhost")
		dbPort := envWithDefault("DB_PORT", "3306")
		dbUser := envWithDefault("DB_USER", "xunjianbao")
		dbPassword := envWithDefault("DB_PASSWORD", "xunjianbao_dev")
		dbName := envWithDefault("DB_NAME", "xunjianbao")
		databaseURL = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			dbUser, dbPassword, dbHost, dbPort, dbName)
	}

	log.Printf("Connecting to MySQL database...")
	gormLogLevel := logger.Info
	if !envConfig.IsDevelopment() {
		gormLogLevel = logger.Warn
	}
	db, err = gorm.Open(mysql.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
	})

	// 旧 SQLite 逻辑（已弃用，保留备参考）：
	// db, err = gorm.Open(sqlite.Open("xunjianbao.db"), &gorm.Config{
	// 	Logger: logger.Default.LogMode(logger.Info),
	// })
	// log.Println("Using SQLite database (development mode)")

	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}

	// 4. 配置连接池
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
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
		&model.AlertRule{},
		&model.Role{},
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

	// 8. 初始化 Redis（非阻塞，连接失败仅禁用缓存）
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	redis.Init(redisURL)

	// 9. 启动 WebSocket Hub
	wsHub := service.NewWebSocketHub()
	go wsHub.Run()

	// 10. 设置路由
	r := router.NewRouter(engine, db)
	r.Setup()

	// 11. 启动服务
	log.Printf("Server starting on port %s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
