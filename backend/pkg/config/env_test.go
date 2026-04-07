package config

import (
	"os"
	"testing"
)

func TestIsDevelopment(t *testing.T) {
	// 保存原始值
	originalGINMode := os.Getenv("GIN_MODE")
	originalEnv := os.Getenv("ENVIRONMENT")
	defer func() {
		os.Setenv("GIN_MODE", originalGINMode)
		os.Setenv("ENVIRONMENT", originalEnv)
	}()

	tests := []struct {
		name     string
		ginMode  string
		env      string
		expected bool
	}{
		{"debug mode", "debug", "", true},
		{"development env", "", "development", true},
		{"test mode", "test", "", true},
		{"release mode", "release", "", false},
		{"production env", "", "production", false},
		{"empty env", "", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("GIN_MODE", tt.ginMode)
			os.Setenv("ENVIRONMENT", tt.env)
			result := IsDevelopment()
			if result != tt.expected {
				t.Errorf("IsDevelopment() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestIsProduction(t *testing.T) {
	// 保存原始值
	originalGINMode := os.Getenv("GIN_MODE")
	originalEnv := os.Getenv("ENVIRONMENT")
	defer func() {
		os.Setenv("GIN_MODE", originalGINMode)
		os.Setenv("ENVIRONMENT", originalEnv)
	}()

	tests := []struct {
		name     string
		ginMode  string
		env      string
		expected bool
	}{
		{"release mode", "release", "", true},
		{"production env", "", "production", true},
		{"debug mode", "debug", "", false},
		{"development env", "", "development", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("GIN_MODE", tt.ginMode)
			os.Setenv("ENVIRONMENT", tt.env)
			result := IsProduction()
			if result != tt.expected {
				t.Errorf("IsProduction() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestGetCurrentEnvironment(t *testing.T) {
	// 保存原始值
	originalGINMode := os.Getenv("GIN_MODE")
	originalEnv := os.Getenv("ENVIRONMENT")
	defer func() {
		os.Setenv("GIN_MODE", originalGINMode)
		os.Setenv("ENVIRONMENT", originalEnv)
	}()

	tests := []struct {
		name     string
		ginMode  string
		env      string
		expected Environment
	}{
		{"production", "release", "", EnvProduction},
		{"production env", "", "production", EnvProduction},
		{"staging env", "", "staging", EnvStaging},
		{"development", "debug", "", EnvDevelopment},
		{"development env", "", "development", EnvDevelopment},
		{"default", "", "", EnvDevelopment},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("GIN_MODE", tt.ginMode)
			os.Setenv("ENVIRONMENT", tt.env)
			result := GetCurrentEnvironment()
			if result != tt.expected {
				t.Errorf("GetCurrentEnvironment() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestIsAuthEnabled(t *testing.T) {
	// 保存原始值
	originalGINMode := os.Getenv("GIN_MODE")
	originalEnv := os.Getenv("ENVIRONMENT")
	originalAuthEnabled := os.Getenv("AUTH_ENABLED")
	defer func() {
		os.Setenv("GIN_MODE", originalGINMode)
		os.Setenv("ENVIRONMENT", originalEnv)
		os.Setenv("AUTH_ENABLED", originalAuthEnabled)
	}()

	tests := []struct {
		name          string
		ginMode      string
		env          string
		authEnabled  string
		expected     bool
	}{
		{"production default", "release", "", "", true},
		{"production explicit enabled", "release", "production", "true", true},
		{"production explicit disabled", "release", "production", "false", false},
		{"development default", "debug", "", "", false},
		{"development explicit enabled", "debug", "development", "true", true},
		{"development explicit disabled", "debug", "development", "false", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("GIN_MODE", tt.ginMode)
			os.Setenv("ENVIRONMENT", tt.env)
			os.Setenv("AUTH_ENABLED", tt.authEnabled)
			result := IsAuthEnabled()
			if result != tt.expected {
				t.Errorf("IsAuthEnabled() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestRepeat(t *testing.T) {
	tests := []struct {
		name   string
		s      string
		count  int
		expected string
	}{
		{"repeat equals", "=", 50, "=================================================="},
		{"repeat hyphen", "-", 5, "-----"},
		{"repeat zero", "x", 0, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := repeat(tt.s, tt.count)
			if result != tt.expected {
				t.Errorf("repeat(%q, %d) = %q, expected %q", tt.s, tt.count, result, tt.expected)
			}
		})
	}
}
