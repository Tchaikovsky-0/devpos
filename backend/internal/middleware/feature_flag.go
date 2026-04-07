package middleware

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

var mockMode bool

// SetMockMode configures the global mock mode flag.
// Default is true (use mock data) if MOCK_MODE env var is not set.
func SetMockMode(modeStr string) {
	mode, err := strconv.ParseBool(modeStr)
	if err != nil {
		// Default to true (mock) if invalid value
		mockMode = true
		return
	}
	mockMode = mode
}

// UseMockMode returns whether mock mode is enabled.
// First checks X-Use-Mock request header (runtime override),
// then falls back to global flag.
func UseMockMode(c *gin.Context) bool {
	// Header override takes precedence (for runtime switching)
	if header := c.GetHeader("X-Use-Mock"); header != "" {
		if val, err := strconv.ParseBool(header); err == nil {
			return val
		}
	}
	// Fall back to environment variable default
	return mockMode
}

// FeatureFlag middleware reads the MOCK_MODE environment variable
// and injects the use_mock flag into the Gin context.
// It also supports X-Use-Mock request header for runtime override.
func FeatureFlag() gin.HandlerFunc {
	// Initialize from environment variable on startup
	if envVal := os.Getenv("MOCK_MODE"); envVal != "" {
		SetMockMode(envVal)
	} else {
		// Default to mock mode for demo environment
		mockMode = true
	}

	return func(c *gin.Context) {
		useMock := UseMockMode(c)
		c.Set("use_mock", useMock)

		// Add header to response so frontend knows current mode
		c.Header("X-Mock-Mode", strconv.FormatBool(useMock))

		c.Next()
	}
}

// RequireRealAPI is a middleware that rejects requests when mock mode is enabled.
// Use this for endpoints that must have real backend data.
func RequireRealAPI() gin.HandlerFunc {
	return func(c *gin.Context) {
		if UseMockMode(c) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "endpoint requires real API (mock mode is enabled)",
			})
			return
		}
		c.Next()
	}
}
