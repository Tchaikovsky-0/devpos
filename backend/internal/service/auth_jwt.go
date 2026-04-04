package service

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "xunjianbao-secret-key-2024-at-least-32-chars"
	}
	return []byte(secret)
}

func generateToken(userID uint, username, tenantID string) (string, time.Time, error) {
	expireAt := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"user_id":   userID,
		"username":  username,
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
