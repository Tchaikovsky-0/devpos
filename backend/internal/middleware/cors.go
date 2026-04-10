package middleware

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSConfig CORS配置
type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
	ExposedHeaders []string
	AllowCredentials bool
	MaxAge          int // 秒
}

// DefaultCORSConfig 默认CORS配置
func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"OPTIONS",
			"HEAD",
		},
		AllowedHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
			"X-Request-ID",
			"X-Correlation-ID",
			"Cache-Control",
		},
		ExposedHeaders: []string{
			"Content-Length",
			"Content-Type",
			"X-Total-Count",
			"X-Page-Count",
		},
		AllowCredentials: true,
		MaxAge:           86400, // 24小时
	}
}

// GetCORSOriginsFromEnv 从环境变量获取允许的来源
func GetCORSOriginsFromEnv() []string {
	envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if envOrigins == "" {
		// 默认只允许本地开发
		if os.Getenv("GIN_MODE") == "debug" || os.Getenv("ENVIRONMENT") == "development" {
			return []string{
				"http://localhost:3000",
				"http://localhost:5173",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:5173",
				"http://0.0.0.0:3000",
			}
		}
		// 生产环境必须配置
		log.Println("⚠️  WARNING: CORS_ALLOWED_ORIGINS not set in production!")
		return []string{}
	}

	// 解析逗号分隔的来源列表
	origins := strings.Split(envOrigins, ",")
	allowedOrigins := make([]string, 0, len(origins))
	for _, origin := range origins {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			allowedOrigins = append(allowedOrigins, origin)
		}
	}

	return allowedOrigins
}

// CORS 安全CORS中间件
func CORS() gin.HandlerFunc {
	config := DefaultCORSConfig()
	allowedOrigins := GetCORSOriginsFromEnv()

	// 合并环境变量中的来源
	if len(allowedOrigins) > 0 {
		config.AllowedOrigins = allowedOrigins
	}

	// 记录CORS配置
	if os.Getenv("GIN_MODE") == "debug" {
		log.Printf("🔧 CORS Configuration (Development Mode):")
		log.Printf("   Allowed Origins: %v", config.AllowedOrigins)
		log.Printf("   Allowed Methods: %v", config.AllowedMethods)
		log.Printf("   Allow Credentials: %v", config.AllowCredentials)
	} else {
		log.Printf("🔒 CORS Configuration (Production Mode):")
		log.Printf("   Allowed Origins: %d domains configured", len(config.AllowedOrigins))
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 没有 Origin 头说明不是浏览器请求（如服务器代理、curl、移动端等），跳过 CORS 检查
		if origin == "" {
			c.Next()
			return
		}

		// 检查origin是否在允许列表中
		allowedOrigin := ""
		for _, allowed := range config.AllowedOrigins {
			if origin == allowed {
				allowedOrigin = origin
				break
			}
			// 支持通配符（仅在开发环境）
			if os.Getenv("GIN_MODE") == "debug" && (allowed == "*" || allowed == "http://localhost:*") {
				if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
					allowedOrigin = origin
					break
				}
			}
		}

		// 生产环境没有匹配到允许的来源时拒绝
		if allowedOrigin == "" && os.Getenv("GIN_MODE") != "debug" {
			log.Printf("❌ CORS blocked origin: %s (not in allowed list)", origin)
			c.AbortWithStatusJSON(403, gin.H{
				"success": false,
				"error": gin.H{
					"code":    403,
					"category": "auth",
					"message": "CORS policy violation: origin not allowed",
				},
			})
			return
		}

		// 开发环境允许所有来源
		if allowedOrigin == "" && os.Getenv("GIN_MODE") == "debug" {
			allowedOrigin = origin
		}

		// 设置CORS头
		if allowedOrigin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Expose-Headers", strings.Join(config.ExposedHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Credentials", strconv.FormatBool(config.AllowCredentials))
		c.Writer.Header().Set("Access-Control-Max-Age", strconv.Itoa(config.MaxAge))

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
