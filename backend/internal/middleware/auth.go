package middleware

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"xunjianbao-backend/pkg/config"
)

var jwtSecret []byte

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	TenantID string `json:"tenant_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, username, role, tenantID string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		TenantID: tenantID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查认证是否启用
		if !config.IsAuthEnabled() {
			// 🔧 开发模式：跳过认证
			log.Printf("🔧 [DEV-AUTH] 跳过认证 - 使用默认开发用户")
			c.Set("user_id", uint(1))
			c.Set("username", "dev_user")
			c.Set("tenant_id", "tenant_default")
			c.Set("role", "admin")
			c.Set("auth_mode", "development_bypass")
			c.Next()
			return
		}

		// 检查Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":     401,
					"category": "auth",
					"message":  "missing authorization token",
					"help_url": "/api/v1/auth/login",
				},
			})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil {
			log.Printf("❌ [AUTH] Token解析失败: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":     401,
					"category": "auth",
					"message":  "invalid token",
					"detail":   "token解析失败或已过期",
				},
			})
			return
		}

		if !token.Valid {
			log.Printf("❌ [AUTH] Token无效")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":     401,
					"category": "auth",
					"message":  "invalid token",
				},
			})
			return
		}

		log.Printf("✅ [AUTH] 用户认证成功: %s (ID: %d)", claims.Username, claims.UserID)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("tenant_id", claims.TenantID)
		c.Set("role", claims.Role)
		c.Set("auth_mode", "production")

		// Token 即将过期检测（剩余 < 30 分钟），自动续签
		if claims.ExpiresAt != nil {
			remaining := time.Until(claims.ExpiresAt.Time)
			if remaining > 0 && remaining < 30*time.Minute {
				newToken, err := GenerateToken(claims.UserID, claims.Username, claims.Role, claims.TenantID)
				if err == nil {
					c.Header("X-New-Token", newToken)
					log.Printf("🔄 [AUTH] Token 即将过期，已自动续签: %s", claims.Username)
				}
			}
		}

		c.Next()
	}
}

// RequireRole 角色检查中间件
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开发模式跳过角色检查
		if !config.IsAuthEnabled() {
			c.Next()
			return
		}

		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":     403,
					"category": "auth",
					"message":  "role not found in context",
				},
			})
			return
		}

		roleStr := userRole.(string)
		for _, role := range allowedRoles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"success": false,
			"error": gin.H{
				"code":     403,
				"category": "auth",
				"message":  "insufficient permissions",
				"detail":   "required roles: " + strings.Join(allowedRoles, ", "),
			},
		})
	}
}
