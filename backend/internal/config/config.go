package config

import (
	"os"
)

type Config struct {
	Port         string
	DatabaseURL  string
	RedisURL     string
	JWTSecret    string
	AIServiceURL string
	YOLOURL      string
	OpenClawURL  string
	OpenClawToken string
}

func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8094"),
		DatabaseURL:   getEnv("DATABASE_URL", ""),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:     getEnv("JWT_SECRET", ""),
		AIServiceURL:  getEnv("AI_SERVICE_URL", "http://localhost:8095"),
		YOLOURL:       getEnv("YOLO_SERVICE_URL", "http://localhost:8097"),
		OpenClawURL:   getEnv("OPENCLAW_URL", "http://localhost:8096"),
		OpenClawToken: getEnv("OPENCLAW_TOKEN", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
