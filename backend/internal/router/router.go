package router

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/config"
	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/service"
)

type Router struct {
	engine             *gin.Engine
	db                 *gorm.DB
	cfg                *config.Config
	wsHub              *service.WebSocketHub
	streamProxyService *service.StreamProxyService
}

func NewRouter(engine *gin.Engine, db *gorm.DB, cfg *config.Config, wsHub *service.WebSocketHub) *Router {
	// 初始化 StreamProxyService
	streamProxyService := service.NewStreamProxyService(db, wsHub, "tmp/hls")

	return &Router{
		engine:             engine,
		db:                 db,
		cfg:                cfg,
		wsHub:              wsHub,
		streamProxyService: streamProxyService,
	}
}

// SecurityHeaders 安全响应头中间件
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:")
		c.Next()
	}
}

func (r *Router) Setup() {
	// ============================================================
	// Service 层初始化
	// ============================================================
	authService := service.NewAuthService(r.db)
	alertService := service.NewAlertService(r.db, r.wsHub)
	streamService := service.NewStreamService(r.db)
	streamProxyService := r.streamProxyService
	yoloDetectionService := service.NewYOLODetectionService(r.db)
	yoloWSService := service.NewYOLOWebSocketService(r.wsHub, alertService, yoloDetectionService)
	dashboardService := service.NewDashboardService(r.db)
	reportService := service.NewReportService(r.db)
	oncallService := service.NewOnCallService(r.db)
	qaService := service.NewQAService(r.db)
	tenantConfigService := service.NewTenantConfigService(r.db)
	aiService := service.NewAIService(r.db, r.cfg)
	sensorService := service.NewSensorService(r.db)
	taskService := service.NewTaskService(r.db)
	mediaService := service.NewMediaService(r.db, aiService)
	defectCaseService := service.NewDefectCaseService(r.db)
	notificationService := service.NewNotificationService()
	alertRuleService := service.NewAlertRuleService(r.db, alertService, notificationService)
	roleService := service.NewRoleService(r.db)

	// 初始化默认角色
	if err := roleService.SeedDefaultRoles("tenant_default"); err != nil {
		log.Printf("⚠️ [RBAC] 初始化默认角色失败: %v", err)
	}

	// 启动 YOLO 检测（mock 模式或定时检测）
	yoloWSService.StartMockMode("tenant_default")
	yoloWSService.StartPeriodicDetection("tenant_default")

	// 避免 unused variable 警告（后续 handler 会使用）
	_ = yoloWSService
	_ = yoloDetectionService

	// ============================================================
	// Handler 层初始化
	// ============================================================
	authHandler := handler.NewAuthHandler(authService)
	streamHandler := handler.NewStreamHandler(streamService, streamProxyService)
	alertHandler := handler.NewAlertHandler(alertService)
	reportHandler := handler.NewReportHandler(reportService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	aiHandler := handler.NewAIHandler(aiService)
	oncallHandler := handler.NewOnCallHandler(oncallService)
	qaHandler := handler.NewQAHandler(qaService)
	tenantConfigHandler := handler.NewTenantConfigHandler(tenantConfigService)
	sensorHandler := handler.NewSensorHandler(sensorService)
	taskHandler := handler.NewTaskHandler(taskService)
	wsHandler := handler.NewWebSocketHandler(r.wsHub)
	mediaHandler := handler.NewMediaHandler(mediaService)
	defectCaseHandler := handler.NewDefectCaseHandler(defectCaseService)
	rbacMiddleware := middleware.NewRBACMiddleware(roleService)
	alertRuleHandler := handler.NewAlertRuleHandler(alertRuleService)
	roleHandler := handler.NewRoleHandler(roleService, rbacMiddleware)

	// ============================================================
	// 中间件
	// ============================================================
	r.engine.Use(middleware.CORS())
	r.engine.Use(SecurityHeaders())

	// 健康检查
	r.engine.GET("/health", func(c *gin.Context) {
		services := gin.H{}

		// 检查 MySQL
		if sqlDB, err := r.db.DB(); err == nil {
			if err := sqlDB.Ping(); err == nil {
				services["mysql"] = "ok"
			} else {
				services["mysql"] = "error"
			}
		} else {
			services["mysql"] = "unavailable"
		}

		c.JSON(200, gin.H{
			"status":   "ok",
			"version":  "2.0.0",
			"services": services,
		})
	})

	// ============================================================
	// API v1
	// ============================================================
	v1 := r.engine.Group("/api/v1")
	{
		// 公开路由
		auth := v1.Group("/auth")
		auth.Use(middleware.LoginRateLimit())
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		// WebSocket 实时连接（公开，token 通过 query param 传递）
		v1.GET("/ws", wsHandler.HandleWebSocket)

		// 需要认证的路由
		protected := v1.Group("")
		protected.Use(middleware.APIRateLimit())
		protected.Use(middleware.AuthMiddleware())
		{
			// 用户
			protected.GET("/user/info", authHandler.GetUserInfo)
			protected.POST("/user/reset-password", authHandler.ResetPassword)

			// Dashboard
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/stats", dashboardHandler.GetStats)
				dashboard.GET("/trends/alerts", dashboardHandler.GetAlertTrends)
				dashboard.GET("/trends/devices", dashboardHandler.GetDeviceTrends)
				dashboard.GET("/top-alerts", dashboardHandler.GetTopAlerts)
				dashboard.GET("/storage", dashboardHandler.GetStorageInfo)
				dashboard.GET("/recent-activities", dashboardHandler.GetRecentActivities)
			}

			// 流
			streams := protected.Group("/streams")
			{
				streams.GET("", streamHandler.List)
				streams.GET("/statistics", streamHandler.Statistics)
				streams.GET("/:id", streamHandler.GetByID)
				streams.POST("", streamHandler.Create)
				streams.PUT("/:id", streamHandler.Update)
				streams.DELETE("/:id", streamHandler.Delete)

				// 流转码代理
				streams.POST("/:id/start", streamHandler.StartTranscoding)
				streams.POST("/:id/stop", streamHandler.StopTranscoding)
				streams.POST("/:id/restart", streamHandler.RestartTranscoding)
				streams.GET("/:id/health", streamHandler.GetHealth)
			}

			// 告警
			alerts := protected.Group("/alerts")
			{
				alerts.GET("", alertHandler.List)
				alerts.GET("/statistics", alertHandler.Statistics)
				alerts.GET("/:id", alertHandler.GetByID)
				alerts.POST("", alertHandler.Create)
				alerts.PUT("/:id", alertHandler.Update)
				alerts.DELETE("/:id", alertHandler.Delete)
			}

			// 报告
			reports := protected.Group("/reports")
			{
				reports.GET("", reportHandler.List)
				reports.GET("/:id", reportHandler.GetByID)
				reports.POST("", reportHandler.Create)
				reports.PUT("/:id", reportHandler.Update)
				reports.DELETE("/:id", reportHandler.Delete)
				reports.GET("/:id/export", reportHandler.Export)
			}

			// AI Agent
			ai := protected.Group("/ai")
			{
				ai.POST("/analyze", aiHandler.Analyze)
				ai.POST("/generate-report", aiHandler.GenerateReport)
				ai.POST("/chat", aiHandler.Chat)
				ai.GET("/models", aiHandler.GetModels)
				ai.GET("/inspection", aiHandler.Inspection)
				ai.POST("/detect/:stream_id", aiHandler.Detect)
				ai.GET("/sessions", aiHandler.GetSessions)
				ai.GET("/sessions/:id", aiHandler.GetSession)
				ai.DELETE("/sessions/:id", aiHandler.DeleteSession)
				ai.POST("/chat/stream", aiHandler.ChatStream)
				ai.POST("/analyze-alert/:id", aiHandler.Analyze)
				ai.POST("/diagnose-device/:id", aiHandler.Analyze)
				ai.GET("/predict/storage/:id", func(c *gin.Context) {
					c.JSON(200, gin.H{"code": 200, "data": gin.H{
						"current_usage":            30.5,
						"predicted_days_remaining": 45,
						"trend":                    "stable",
					}})
				})
			}

			// OnCall 排班
			oncall := protected.Group("/oncall")
			{
				oncall.GET("/current", oncallHandler.GetCurrentSchedule)
				oncall.GET("/schedules", oncallHandler.GetSchedules)
				oncall.POST("/schedules", oncallHandler.CreateSchedule)
				oncall.GET("/schedules/:schedule_id/alerts", oncallHandler.GetAlertsBySchedule)
				oncall.POST("/schedules/:schedule_id/report", oncallHandler.CreateReport)
				oncall.POST("/alerts/:alert_id/acknowledge", oncallHandler.AcknowledgeAlert)
				oncall.GET("/reports", oncallHandler.GetReports)
				oncall.GET("/analysts", oncallHandler.GetAnalysts)
				oncall.POST("/analysis/request", oncallHandler.RequestAnalysis)
			}

			// QA 知识库
			qa := protected.Group("/qa")
			{
				qa.POST("/ask", qaHandler.Ask)
				qa.GET("/conversations", qaHandler.GetConversations)
				qa.GET("/conversations/:id", qaHandler.GetConversationByID)
				qa.POST("/conversations/:id/feedback", qaHandler.ProvideFeedback)
				qa.GET("/knowledge-bases", qaHandler.GetKnowledgeBases)
				qa.POST("/knowledge-bases", qaHandler.CreateKnowledgeBase)
				qa.POST("/knowledge-bases/:knowledge_base_id/documents", qaHandler.UploadDocument)
				qa.DELETE("/knowledge-bases/:id", qaHandler.DeleteKnowledgeBase)
				qa.POST("/knowledge-bases/:knowledge_base_id/search", qaHandler.SearchDocuments)
			}

			// 租户配置
			tenant := protected.Group("/tenant")
			{
				tenant.GET("/config", tenantConfigHandler.Get)
				tenant.PUT("/config", tenantConfigHandler.Update)
				tenant.GET("/storage", tenantConfigHandler.GetStorage)
				tenant.GET("/devices", tenantConfigHandler.GetDevices)
				tenant.GET("/usage", tenantConfigHandler.GetUsageStatistics)
				tenant.GET("/features", tenantConfigHandler.GetFeatures)
				tenant.PUT("/features", tenantConfigHandler.UpdateFeatures)
			}

			// 传感器
			sensors := protected.Group("/sensors")
			{
				sensors.GET("", sensorHandler.List)
				sensors.GET("/:id", sensorHandler.GetByID)
				sensors.POST("", sensorHandler.Create)
				sensors.PUT("/:id", sensorHandler.Update)
				sensors.DELETE("/:id", sensorHandler.Delete)
				sensors.GET("/:id/data", sensorHandler.GetData)
			}

			// 巡检任务
			tasks := protected.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.GET("/:id", taskHandler.GetByID)
				tasks.POST("", taskHandler.Create)
				tasks.PUT("/:id", taskHandler.Update)
				tasks.DELETE("/:id", taskHandler.Delete)
				tasks.POST("/:id/assign", taskHandler.Assign)
				tasks.POST("/:id/complete", taskHandler.Complete)
			}

			// 媒体文件
			mediaGroup := protected.Group("/media")
			{
				mediaGroup.GET("", mediaHandler.List)
				mediaGroup.GET("/trash", mediaHandler.ListTrash)
				mediaGroup.GET("/:id", mediaHandler.GetByID)
				mediaGroup.POST("/upload", mediaHandler.Upload)
				mediaGroup.PUT("/:id", mediaHandler.Update)
				mediaGroup.DELETE("/:id", mediaHandler.Delete)
				mediaGroup.GET("/:id/download", mediaHandler.Download)
				mediaGroup.GET("/folders", mediaHandler.ListFolders)
				mediaGroup.POST("/folders", mediaHandler.CreateFolder)
				mediaGroup.PUT("/folders/:id", mediaHandler.UpdateFolder)
				mediaGroup.DELETE("/folders/:id", mediaHandler.DeleteFolder)
				mediaGroup.GET("/storage-info", mediaHandler.StorageInfo)
				mediaGroup.GET("/files/*filepath", mediaHandler.ServeFile)
				// 收藏/回收站
				mediaGroup.PUT("/:id/star", mediaHandler.ToggleStar)
				mediaGroup.PUT("/:id/trash", mediaHandler.MoveToTrash)
				mediaGroup.PUT("/trash/restore", mediaHandler.RestoreFromTrash)
				mediaGroup.DELETE("/trash", mediaHandler.PermanentDeleteTrash)
				// 批量操作
				mediaGroup.PUT("/batch/move", mediaHandler.BatchMove)
				mediaGroup.DELETE("/batch", mediaHandler.BatchDelete)
				// 清理操作
				mediaGroup.POST("/trash/clean-expired", mediaHandler.CleanExpiredTrash)
				mediaGroup.GET("/orphan-files", mediaHandler.DetectOrphanFiles)
				mediaGroup.POST("/orphan-files/clean", mediaHandler.CleanOrphanFiles)
				mediaGroup.GET("/storage-usage", mediaHandler.StorageUsage)
				// AI 分析与报告
				mediaGroup.POST("/analyze", mediaHandler.AnalyzeMedia)
				mediaGroup.POST("/defect-analyze", mediaHandler.DefectAnalyzeMedia)
				mediaGroup.POST("/report", mediaHandler.GenerateReport)
			}

			// 缺陷案例
			defectCases := protected.Group("/defect-cases")
			{
				defectCases.GET("", defectCaseHandler.List)
				defectCases.GET("/statistics", defectCaseHandler.Statistics)
				defectCases.POST("", defectCaseHandler.Create)
				defectCases.POST("/from-detection/:detection_id", defectCaseHandler.CreateFromDetection)
				defectCases.POST("/merge", defectCaseHandler.MergeCases)
				defectCases.GET("/:id", defectCaseHandler.GetByID)
				defectCases.PUT("/:id", defectCaseHandler.Update)
				defectCases.DELETE("/:id", defectCaseHandler.Delete)
				defectCases.POST("/:id/split", defectCaseHandler.SplitCase)
				defectCases.PUT("/:id/representative", defectCaseHandler.SetRepresentative)
				defectCases.POST("/:id/evidence", defectCaseHandler.AddEvidence)

				// 报告草稿
				defectCases.POST("/:id/drafts", defectCaseHandler.CreateReportDraft)
				defectCases.GET("/:id/drafts/:draft_id", defectCaseHandler.GetReportDraft)
				defectCases.PUT("/:id/drafts/:draft_id", defectCaseHandler.UpdateReportDraft)
				defectCases.POST("/:id/drafts/:draft_id/approve", defectCaseHandler.ApproveReportDraft)
			}

			// 告警规则引擎
			alertRuleHandler.RegisterRoutes(protected)

			// RBAC 权限管理
			roleHandler.RegisterRoutes(protected)
		}
	}

	// HLS 静态文件服务（不需要认证）
	r.engine.GET("/hls/:stream_id/*filepath", streamHandler.ServeHLS)
	r.engine.OPTIONS("/hls/:stream_id/*filepath", streamHandler.ServeHLSOptions)

	// 启动流健康检查（每 30 秒）
	streamProxyService.StartHealthCheck(30 * time.Second)
}
