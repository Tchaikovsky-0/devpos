#!/usr/bin/env python3
"""Write router file."""

router_code = r'''package router

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
	return &Router{engine: engine, db: db}
}

func (r *Router) Setup() {
	cacheService := service.NewCacheService()
	authService := service.NewAuthService(r.db)
	streamService := service.NewStreamService(r.db, cacheService)
	alertService := service.NewAlertService(r.db, cacheService, service.NewAlertTrigger(r.db))
	dashboardService := service.NewDashboardService(r.db, cacheService)
	reportService := service.NewReportService(r.db)
	oncallService := service.NewOnCallService(r.db)
	qaService := service.NewQAService(r.db)
	tenantConfigService := service.NewTenantConfigService(r.db, cacheService)
	aiService := service.NewAIService(r.db, nil)
	sensorService := service.NewSensorService(r.db)
	taskService := service.NewTaskService(r.db)
	mediaService := service.NewMediaService(r.db, aiService)
	defectCaseService := service.NewDefectCaseService(r.db)
	openclawService := service.NewOpenClawService(r.db)

	authHandler := handler.NewAuthHandler(authService)
	streamHandler := handler.NewStreamHandler(streamService)
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

	r.engine.Use(middleware.CORS())
	r.engine.Use(SecurityHeaders())

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
		c.JSON(200, gin.H{"status": "ok", "version": "2.0.0", "services": services})
	})

	v1 := r.engine.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "version": "2.0.0"})
		})

		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/user/info", authHandler.GetUserInfo)

			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/stats", dashboardHandler.GetStats)
				dashboard.GET("/trends/alerts", dashboardHandler.GetAlertTrends)
				dashboard.GET("/trends/devices", dashboardHandler.GetDeviceTrends)
			}

			streams := protected.Group("/streams")
			{
				streams.GET("", streamHandler.List)
				streams.GET("/:id", streamHandler.GetByID)
				streams.POST("", streamHandler.Create)
				streams.PUT("/:id", streamHandler.Update)
				streams.DELETE("/:id", streamHandler.Delete)
			}

			alerts := protected.Group("/alerts")
			{
				alerts.GET("", alertHandler.List)
				alerts.GET("/:id", alertHandler.GetByID)
				alerts.POST("", alertHandler.Create)
			}

			reports := protected.Group("/reports")
			{
				reports.GET("", reportHandler.List)
				reports.GET("/:id", reportHandler.GetByID)
				reports.POST("", reportHandler.Create)
				reports.DELETE("/:id", reportHandler.Delete)
			}

			oncall := protected.Group("/oncall")
			{
				oncall.GET("/schedules", oncallHandler.ListSchedules)
				oncall.GET("/schedules/:id", oncallHandler.GetSchedule)
				oncall.GET("/reports", oncallHandler.ListReports)
				oncall.GET("/reports/:id", oncallHandler.GetReport)
			}

			qa := protected.Group("/qa")
			{
				qa.GET("/knowledge-bases", qaHandler.ListKnowledgeBase)
				qa.POST("/knowledge-bases/search", qaHandler.SearchKnowledgeBase)
				qa.GET("/conversations", qaHandler.ListConversations)
				qa.POST("/conversations", qaHandler.SaveConversation)
			}

			tenant := protected.Group("/tenant")
			{
				tenant.GET("/config", tenantConfigHandler.GetConfig)
				tenant.PUT("/config", tenantConfigHandler.UpdateConfig)
				tenant.GET("/usage", tenantConfigHandler.GetUsageStatistics)
				tenant.GET("/monthly-report", tenantConfigHandler.GetMonthlyReport)
			}

			sensors := protected.Group("/sensors")
			{
				sensors.GET("", sensorHandler.ListSensors)
				sensors.GET("/:id", sensorHandler.GetSensorByID)
				sensors.POST("", sensorHandler.CreateSensor)
				sensors.PUT("/:id", sensorHandler.UpdateSensor)
				sensors.DELETE("/:id", sensorHandler.DeleteSensor)
				sensors.GET("/:id/data", sensorHandler.ListSensorData)
				sensors.POST("/data", sensorHandler.IngestData)
				sensors.GET("/statistics", sensorHandler.GetSensorStatistics)
			}

			tasks := protected.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.GET("/:id", taskHandler.GetByID)
				tasks.POST("", taskHandler.Create)
				tasks.PUT("/:id", taskHandler.Update)
				tasks.DELETE("/:id", taskHandler.Delete)
				tasks.PUT("/:id/status", taskHandler.UpdateStatus)
				tasks.GET("/statistics", taskHandler.GetStatistics)
				tasks.GET("/:id/comments", taskHandler.ListComments)
				tasks.POST("/:id/comments", taskHandler.AddComment)
				tasks.GET("/:id/history", taskHandler.ListHistory)
			}

			mediaGroup := protected.Group("/media")
			{
				mediaGroup.GET("", mediaHandler.List)
				mediaGroup.GET("/trash", mediaHandler.ListTrash)
				mediaGroup.GET("/:id", mediaHandler.GetByID)
				mediaGroup.POST("/upload", mediaHandler.Upload)
				mediaGroup.PUT("/:id", mediaHandler.Update)
				mediaGroup.DELETE("/:id", mediaHandler.Delete)
				mediaGroup.GET("/:id/download", mediaHandler.Download)
				mediaGroup.GET("/:id/file", mediaHandler.ServeFile)
				mediaGroup.GET("/folders", mediaHandler.ListFolders)
				mediaGroup.POST("/folders", mediaHandler.CreateFolder)
				mediaGroup.PUT("/folders/:id", mediaHandler.UpdateFolder)
				mediaGroup.DELETE("/folders/:id", mediaHandler.DeleteFolder)
				mediaGroup.GET("/storage/info", mediaHandler.StorageInfo)
				mediaGroup.GET("/storage/usage", mediaHandler.StorageUsage)
				mediaGroup.POST("/:id/star", mediaHandler.ToggleStar)
				mediaGroup.POST("/:id/trash", mediaHandler.MoveToTrash)
				mediaGroup.POST("/:id/restore", mediaHandler.RestoreFromTrash)
				mediaGroup.POST("/batch/move", mediaHandler.BatchMove)
				mediaGroup.POST("/batch/delete", mediaHandler.BatchDelete)
			}

			defectCases := protected.Group("/defect-cases")
			{
				defectCases.GET("", defectCaseHandler.List)
				defectCases.GET("/statistics", defectCaseHandler.GetStatistics)
				defectCases.POST("", defectCaseHandler.Create)
				defectCases.GET("/:id", defectCaseHandler.GetByID)
				defectCases.PUT("/:id/status", defectCaseHandler.UpdateStatus)
				defectCases.DELETE("/:id", defectCaseHandler.Delete)
				defectCases.POST("/:id/evidence", defectCaseHandler.AddEvidence)
				defectCases.GET("/:id/evidence", defectCaseHandler.ListEvidence)
				defectCases.GET("/:id/drafts", defectCaseHandler.ListReportDrafts)
				defectCases.GET("/:id/drafts/:draft_id", defectCaseHandler.GetReportDraftByID)
				defectCases.POST("/:id/drafts", defectCaseHandler.CreateReportDraft)
				defectCases.PUT("/:id/drafts/:draft_id", defectCaseHandler.UpdateReportDraft)
				defectCases.DELETE("/:id/drafts/:draft_id", defectCaseHandler.DeleteReportDraft)
			}

			openclaw := protected.Group("/openclaw")
			{
				openclaw.GET("/health", openclawHandler.Health)
				openclaw.GET("/missions", openclawHandler.ListMissions)
				openclaw.GET("/missions/statistics", openclawHandler.GetMissionStatistics)
				openclaw.GET("/missions/:id", openclawHandler.GetMission)
				openclaw.POST("/missions", openclawHandler.CreateMission)
				openclaw.PUT("/missions/:id", openclawHandler.UpdateMission)
				openclaw.DELETE("/missions/:id", openclawHandler.DeleteMission)
				openclaw.GET("/templates", openclawHandler.ListTemplates)
				openclaw.GET("/templates/:id", openclawHandler.GetTemplate)
				openclaw.POST("/templates", openclawHandler.CreateTemplate)
				openclaw.PUT("/templates/:id", openclawHandler.UpdateTemplate)
				openclaw.DELETE("/templates/:id", openclawHandler.DeleteTemplate)
				openclaw.POST("/chat", openclawHandler.Chat)
				openclaw.GET("/analyze/alerts", openclawHandler.AnalyzeAlerts)
				openclaw.GET("/devices/status", openclawHandler.GetDevicesStatus)
				openclaw.GET("/detection/overview", openclawHandler.GetDetectionOverview)
			}
		}
	}

	r.engine.Static("/hls", "./uploads/hls")
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
'''

with open("/opt/xunjianbao/backend/internal/router/router.go", "w") as f:
    f.write(router_code)
print("Router file written")
