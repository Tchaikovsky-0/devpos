package router

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/service"
)

type Router struct {
	engine *gin.Engine
	db     *gorm.DB
}

func NewRouter(engine *gin.Engine, db *gorm.DB) *Router {
	return &Router{
		engine: engine,
		db:     db,
	}
}

func (r *Router) Setup() {
	// ============================================================
	// Service 层初始化
	// ============================================================
	authService := service.NewAuthService(r.db)
	streamService := service.NewStreamService(r.db)
	wsHub := service.NewWebSocketHub()
	alertService := service.NewAlertService(r.db, wsHub)
	dashboardService := service.NewDashboardService(r.db)
	reportService := service.NewReportService(r.db)
	oncallService := service.NewOnCallService(r.db)
	qaService := service.NewQAService(r.db)
	tenantConfigService := service.NewTenantConfigService(r.db)
	aiService := service.NewAIService(r.db, nil)
	sensorService := service.NewSensorService(r.db)
	taskService := service.NewTaskService(r.db)
	mediaService := service.NewMediaService(r.db, aiService)
	defectCaseService := service.NewDefectCaseService(r.db)
	openclawService := service.NewOpenClawService(r.db, nil)
	annotationService := service.NewAnnotationService(r.db)

	// ============================================================
	// Handler 层初始化
	// ============================================================
	authHandler := handler.NewAuthHandler(authService)
	streamHandler := handler.NewStreamHandler(streamService, nil)
	alertHandler := handler.NewAlertHandler(alertService)
	reportHandler := handler.NewReportHandler(reportService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	oncallHandler := handler.NewOnCallHandler(oncallService)
	qaHandler := handler.NewQAHandler(qaService)
	tenantConfigHandler := handler.NewTenantConfigHandler(tenantConfigService)
	sensorHandler := handler.NewSensorHandler(sensorService)
	taskHandler := handler.NewTaskHandler(taskService)
	mediaHandler := handler.NewMediaHandler(mediaService)
	defectCaseHandler := handler.NewDefectCaseHandler(defectCaseService)
	openclawHandler := handler.NewOpenClawHandler(openclawService)
	annotationHandler := handler.NewAnnotationHandler(annotationService)

	// ============================================================
	// 中间件
	// ============================================================
	r.engine.Use(middleware.CORS())
	r.engine.Use(SecurityHeaders())

	// 健康检查
	r.engine.GET("/health", func(c *gin.Context) {
		services := gin.H{}
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
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "version": "2.0.0"})
		})

		// 公开路由
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		// 需要认证的路由
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// 用户
			protected.GET("/user/info", authHandler.GetUserInfo)

			// Dashboard
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/stats", dashboardHandler.GetStats)
				dashboard.GET("/trends/alerts", dashboardHandler.GetAlertTrends)
				dashboard.GET("/trends/devices", dashboardHandler.GetDeviceTrends)
			}

			// 流
			streams := protected.Group("/streams")
			{
				streams.GET("", streamHandler.List)
				streams.GET("/:id", streamHandler.GetByID)
				streams.POST("", streamHandler.Create)
				streams.PUT("/:id", streamHandler.Update)
				streams.DELETE("/:id", streamHandler.Delete)
			}

			// 告警
			alerts := protected.Group("/alerts")
			{
				alerts.GET("", alertHandler.List)
				alerts.GET("/:id", alertHandler.GetByID)
				alerts.POST("", alertHandler.Create)
			}

			// 报告
			reports := protected.Group("/reports")
			{
				reports.GET("", reportHandler.List)
				reports.GET("/:id", reportHandler.GetByID)
				reports.POST("", reportHandler.Create)
				reports.DELETE("/:id", reportHandler.Delete)
			}

			// OnCall 排班
			oncall := protected.Group("/oncall")
			{
				oncall.GET("/schedules", oncallHandler.GetSchedules)
				oncall.GET("/schedule/current", oncallHandler.GetCurrentSchedule)
				oncall.POST("/schedules", oncallHandler.CreateSchedule)
				oncall.GET("/alerts/:scheduleId", oncallHandler.GetAlertsBySchedule)
				oncall.POST("/alerts/:alertId/ack", oncallHandler.AcknowledgeAlert)
				oncall.GET("/reports", oncallHandler.GetReports)
				oncall.POST("/reports", oncallHandler.CreateReport)
				oncall.GET("/analysts", oncallHandler.GetAnalysts)
				oncall.POST("/analysis", oncallHandler.RequestAnalysis)
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
				qa.POST("/knowledge-bases/:id/documents", qaHandler.UploadDocument)
				qa.DELETE("/knowledge-bases/:id", qaHandler.DeleteKnowledgeBase)
				qa.POST("/documents/search", qaHandler.SearchDocuments)
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
			}

			// 媒体文件
			mediaGroup := protected.Group("/media")
			{
				mediaGroup.GET("", mediaHandler.List)
				mediaGroup.POST("/upload", mediaHandler.Upload)
				mediaGroup.GET("/trash", mediaHandler.ListTrash)
				mediaGroup.GET("/storage-info", mediaHandler.StorageInfo)
				mediaGroup.GET("/storage-usage", mediaHandler.StorageUsage)
				mediaGroup.GET("/folders", mediaHandler.ListFolders)
				mediaGroup.POST("/folders", mediaHandler.CreateFolder)
				mediaGroup.GET("/folders/accessible", mediaHandler.ListAccessibleFolders)
				mediaGroup.POST("/trash/restore", mediaHandler.RestoreFromTrash)
				mediaGroup.POST("/trash/permanent-delete", mediaHandler.PermanentDeleteTrash)
				mediaGroup.POST("/trash/clean-expired", mediaHandler.CleanExpiredTrash)
				mediaGroup.POST("/batch-move", mediaHandler.BatchMove)
				mediaGroup.POST("/batch-delete", mediaHandler.BatchDelete)
				mediaGroup.POST("/batch-dedupe", mediaHandler.BatchDedupe)
				mediaGroup.POST("/semantic-dedupe", mediaHandler.SemanticDedupe)
				mediaGroup.GET("/orphans/detect", mediaHandler.DetectOrphanFiles)
				mediaGroup.POST("/orphans/clean", mediaHandler.CleanOrphanFiles)
				mediaGroup.POST("/analyze", mediaHandler.AnalyzeMedia)
				mediaGroup.POST("/defect-analyze", mediaHandler.DefectAnalyzeMedia)
				mediaGroup.POST("/generate-report", mediaHandler.GenerateReport)
				mediaGroup.GET("/:id", mediaHandler.GetByID)
				mediaGroup.GET("/:id/download", mediaHandler.Download)
				mediaGroup.PUT("/:id", mediaHandler.Update)
				mediaGroup.DELETE("/:id", mediaHandler.Delete)
				mediaGroup.POST("/:id/star", mediaHandler.ToggleStar)
				mediaGroup.POST("/:id/trash", mediaHandler.MoveToTrash)
				mediaGroup.GET("/:id/folder-permissions", mediaHandler.ListFolderPermissions)
				mediaGroup.POST("/:id/folder-permissions", mediaHandler.GrantFolderPermission)
				mediaGroup.DELETE("/:id/folder-permissions/:userId", mediaHandler.RevokeFolderPermission)
				mediaGroup.PUT("/:id/folder-permissions/:userId", mediaHandler.UpdateFolderPermission)
				mediaGroup.PUT("/:id/folder-public", mediaHandler.SetFolderPublic)
				mediaGroup.PUT("/folders/:id", mediaHandler.UpdateFolder)
				mediaGroup.DELETE("/folders/:id", mediaHandler.DeleteFolder)
			}

			// 缺陷案例
			defectCases := protected.Group("/defect-cases")
			{
				defectCases.GET("", defectCaseHandler.List)
				defectCases.GET("/statistics", defectCaseHandler.Statistics)
				defectCases.POST("", defectCaseHandler.Create)
				defectCases.POST("/from-detection", defectCaseHandler.CreateFromDetection)
				defectCases.GET("/:id", defectCaseHandler.GetByID)
				defectCases.PUT("/:id", defectCaseHandler.Update)
				defectCases.DELETE("/:id", defectCaseHandler.Delete)
				defectCases.POST("/:id/merge", defectCaseHandler.MergeCases)
				defectCases.POST("/:id/split", defectCaseHandler.SplitCase)
				defectCases.POST("/:id/representative", defectCaseHandler.SetRepresentative)
				defectCases.POST("/:id/evidence", defectCaseHandler.AddEvidence)
				defectCases.PUT("/:id/evidence", defectCaseHandler.SaveEvidence)
				defectCases.POST("/:id/drafts", defectCaseHandler.CreateReportDraft)
				defectCases.GET("/:id/drafts/:draft_id", defectCaseHandler.GetReportDraft)
				defectCases.PUT("/:id/drafts/:draft_id", defectCaseHandler.UpdateReportDraft)
				defectCases.POST("/:id/drafts/:draft_id/approve", defectCaseHandler.ApproveReportDraft)
			}

			// OpenClaw AI
			openclaw := protected.Group("/openclaw")
			{
				// Health
				openclaw.GET("/health", openclawHandler.Health)

				// Missions
				openclaw.GET("/missions", openclawHandler.ListMissions)
				openclaw.GET("/missions/statistics", openclawHandler.GetMissionStatistics)
				openclaw.GET("/missions/:id", openclawHandler.GetMission)
				openclaw.POST("/missions", openclawHandler.CreateMission)
				openclaw.PUT("/missions/:id", openclawHandler.UpdateMission)
				openclaw.DELETE("/missions/:id", openclawHandler.DeleteMission)

				// Templates
				openclaw.GET("/templates", openclawHandler.ListTemplates)
				openclaw.GET("/templates/:id", openclawHandler.GetTemplate)
				openclaw.POST("/templates", openclawHandler.CreateTemplate)
				openclaw.PUT("/templates/:id", openclawHandler.UpdateTemplate)
				openclaw.DELETE("/templates/:id", openclawHandler.DeleteTemplate)

				// Chat
				openclaw.POST("/chat", openclawHandler.Chat)

				// Analyze
				openclaw.GET("/analyze/alerts", openclawHandler.AnalyzeAlerts)

				// Devices
				openclaw.GET("/devices/status", openclawHandler.GetDevicesStatus)

				// Detection
				openclaw.GET("/detection/overview", openclawHandler.GetDetectionOverview)
			}

			// Annotations (manual labeling)
			annotations := protected.Group("/annotations")
			{
				annotations.GET("", annotationHandler.ListAnnotations)
				annotations.GET("/stats", annotationHandler.GetAnnotationStats)
				annotations.GET("/user", annotationHandler.GetUserAnnotations)
				annotations.GET("/:id", annotationHandler.GetAnnotation)
				annotations.POST("", annotationHandler.CreateAnnotation)
				annotations.PUT("/:id", annotationHandler.UpdateAnnotation)
				annotations.DELETE("/:id", annotationHandler.DeleteAnnotation)
			}
		}
	}

	// HLS 静态文件服务
	r.engine.Static("/hls", "./uploads/hls")

	// 媒体文件服务（需认证 + 租户隔离）
	r.engine.Any("/api/v1/media/files/*filepath", middleware.AuthMiddleware(), mediaHandler.ServeFile)
}

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Next()
	}
}
