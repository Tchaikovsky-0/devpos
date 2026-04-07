package middleware

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger middleware for detailed request logging
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		method := c.Request.Method
		clientIP := c.ClientIP()
		userAgent := c.Request.UserAgent()

		// Process request
		c.Next()

		// Log after request
		latency := time.Since(start)
		statusCode := c.Writer.Status()
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		logEntry := fmt.Sprintf(
			"[REQUEST] %s %s%s %d %v client=%s ua=\"%s\"",
			method,
			path,
			query,
			statusCode,
			latency,
			clientIP,
			userAgent,
		)

		if statusCode >= 500 {
			log.Printf("[ERROR] %s error=\"%s\"", logEntry, errorMessage)
		} else if statusCode >= 400 {
			log.Printf("[WARN] %s", logEntry)
		} else {
			log.Printf("[INFO] %s", logEntry)
		}
	}
}

// ErrorLogger middleware for centralized error logging
func ErrorLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for errors attached to the context
		for _, err := range c.Errors {
			log.Printf(
				"[ERROR] path=%s method=%s error=\"%s\" meta=%v",
				c.Request.URL.Path,
				c.Request.Method,
				err.Error(),
				err.Meta,
			)
		}
	}
}

// StructuredLogger outputs structured JSON logs
func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Build structured log
		logData := map[string]interface{}{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"method":    c.Request.Method,
			"path":      c.Request.URL.Path,
			"status":    c.Writer.Status(),
			"latency":   time.Since(start).Milliseconds(),
			"client_ip": c.ClientIP(),
		}

		// Add query params if present
		if c.Request.URL.RawQuery != "" {
			logData["query"] = c.Request.URL.RawQuery
		}

		// Add error if any
		if len(c.Errors) > 0 {
			logData["error"] = c.Errors.Last().Error()
			logData["level"] = "error"
		} else if c.Writer.Status() >= 500 {
			logData["level"] = "error"
		} else if c.Writer.Status() >= 400 {
			logData["level"] = "warn"
		} else {
			logData["level"] = "info"
		}

		// Output JSON log
		if os.Getenv("LOG_FORMAT") == "json" {
			logJSON(logData)
		}
	}
}

func logJSON(data map[string]interface{}) {
	// Simple JSON logging - in production, use a proper JSON encoder
	log.Printf("[JSON_LOG] %+v", data)
}
