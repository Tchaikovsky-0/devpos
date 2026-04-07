package service

import (
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("⚠️ [SECURITY] JWT_SECRET not set, using insecure default. DO NOT use in production!")
		secret = "xunjianbao-secret-key-2024-at-least-32-chars"
	}
	return []byte(secret)
}

// generateToken 生成JWT Token，包含user_id、username、role、tenant_id
func generateToken(userID uint, username, role, tenantID string) (string, time.Time, error) {
	expireAt := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"user_id":   userID,
		"username":  username,
		"role":      role,
		"tenant_id": tenantID,
		"exp":       expireAt.Unix(),
		"iat":       time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expireAt, nil
}
