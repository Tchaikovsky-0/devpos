package middleware

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestGetMaxUploadSize(t *testing.T) {
	// 测试默认值
	size := GetMaxUploadSize()
	if size != DefaultMaxUploadSize {
		t.Errorf("Expected default size %d, got %d", DefaultMaxUploadSize, size)
	}
}

func TestFormatFileSize(t *testing.T) {
	tests := []struct {
		name     string
		bytes    int64
		expected string
	}{
		{"bytes", 500, "500 B"},
		{"kilobytes", 2048, "2.00 KB"},
		{"megabytes", 10485760, "10.00 MB"},
		{"zero", 0, "0 B"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatFileSize(tt.bytes)
			if result != tt.expected {
				t.Errorf("FormatFileSize(%d) = %s, expected %s", tt.bytes, result, tt.expected)
			}
		})
	}
}

func TestDefaultImageConfig(t *testing.T) {
	config := DefaultImageConfig()

	if config.MaxSize != 5*1024*1024 {
		t.Errorf("Expected max size 5MB, got %d", config.MaxSize)
	}

	if len(config.AllowedTypes) == 0 {
		t.Error("Expected allowed types to be non-empty")
	}

	expectedTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	for _, expected := range expectedTypes {
		found := false
		for _, actual := range config.AllowedTypes {
			if actual == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected allowed type %s not found", expected)
		}
	}
}

func TestDefaultVideoConfig(t *testing.T) {
	config := DefaultVideoConfig()

	if config.MaxSize != 100*1024*1024 {
		t.Errorf("Expected max size 100MB, got %d", config.MaxSize)
	}

	if config.MaxDuration != 300 {
		t.Errorf("Expected max duration 300s, got %d", config.MaxDuration)
	}
}

func TestDefaultDocumentConfig(t *testing.T) {
	config := DefaultDocumentConfig()

	if config.MaxSize != 20*1024*1024 {
		t.Errorf("Expected max size 20MB, got %d", config.MaxSize)
	}

	if len(config.AllowedTypes) == 0 {
		t.Error("Expected allowed types to be non-empty")
	}
}

func TestValidateImageUpload(t *testing.T) {
	config := DefaultImageConfig()

	// 测试有效文件类型
	err := ValidateImageUpload("image/jpeg", 1024, config)
	if err != nil {
		t.Errorf("Expected no error for valid image, got %v", err)
	}

	// 测试无效文件类型
	err = ValidateImageUpload("application/pdf", 1024, config)
	if err == nil {
		t.Error("Expected error for invalid file type")
	}

	// 测试文件过大
	err = ValidateImageUpload("image/jpeg", config.MaxSize+1, config)
	if err == nil {
		t.Error("Expected error for file too large")
	}
}
