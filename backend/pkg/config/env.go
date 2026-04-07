package config

import (
	"log"
	"os"
)

// Environment 环境类型
type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvStaging    Environment = "staging"
	EnvProduction Environment = "production"
)

// IsDevelopment 检查是否开发环境
func IsDevelopment() bool {
	return os.Getenv("GIN_MODE") == "debug" ||
		os.Getenv("ENVIRONMENT") == string(EnvDevelopment) ||
		os.Getenv("GIN_MODE") == "test"
}

// IsProduction 检查是否生产环境
func IsProduction() bool {
	return os.Getenv("GIN_MODE") == "release" ||
		os.Getenv("ENVIRONMENT") == string(EnvProduction)
}

// IsStaging 检查是否预发布环境
func IsStaging() bool {
	return os.Getenv("ENVIRONMENT") == string(EnvStaging)
}

// GetCurrentEnvironment 获取当前环境
func GetCurrentEnvironment() Environment {
	if IsProduction() {
		return EnvProduction
	}
	if IsStaging() {
		return EnvStaging
	}
	return EnvDevelopment
}

// LogEnvironmentInfo 记录环境信息
func LogEnvironmentInfo() {
	env := GetCurrentEnvironment()

	log.Printf("=" + repeat("=", 50))
	log.Printf("环境信息:")
	log.Printf("  当前环境: %s", env)
	log.Printf("  GIN_MODE: %s", os.Getenv("GIN_MODE"))
	log.Printf("  ENVIRONMENT: %s", os.Getenv("ENVIRONMENT"))

	if IsDevelopment() {
		log.Printf("")
		log.Printf("  ⚠️  开发模式配置:")
		log.Printf("     - 认证已禁用")
		log.Printf("     - CORS 允许所有来源")
		log.Printf("     - 使用模拟数据")
		log.Printf("     - 日志详细模式")
	}

	if IsProduction() {
		log.Printf("")
		log.Printf("  🔒 生产模式配置:")
		log.Printf("     - 认证必须")
		log.Printf("     - CORS 严格限制")
		log.Printf("     - 使用真实数据")
		log.Printf("     - 日志最小化")
	}

	log.Printf("=" + repeat("=", 50))
}

// repeat 重复字符串
func repeat(s string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += s
	}
	return result
}

// IsAuthEnabled 检查认证是否启用
func IsAuthEnabled() bool {
	// 生产环境必须启用认证
	if IsProduction() {
		return true
	}

	// 可以通过环境变量强制启用/禁用
	authEnabled := os.Getenv("AUTH_ENABLED")
	if authEnabled == "true" {
		return true
	}
	if authEnabled == "false" {
		return false
	}

	// 默认：开发环境禁用认证
	return !IsDevelopment()
}

// IsMockDataEnabled 检查是否启用模拟数据
func IsMockDataEnabled() bool {
	if IsProduction() {
		return false
	}

	mockEnabled := os.Getenv("MOCK_DATA_ENABLED")
	if mockEnabled == "true" {
		return true
	}
	if mockEnabled == "false" {
		return false
	}

	// 默认：开发环境启用模拟数据
	return IsDevelopment()
}
