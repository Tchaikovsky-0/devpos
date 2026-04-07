package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/pkg/response"
)

const (
	// 默认最大文件大小 10MB
	DefaultMaxUploadSize = 10 * 1024 * 1024

	// 环境变量名
	envMaxUploadSize = "MAX_UPLOAD_SIZE"
)

// UploadConfig 上传配置
type UploadConfig struct {
	MaxSize int64
}

// GetMaxUploadSize 获取最大上传大小（字节）
func GetMaxUploadSize() int64 {
	// 从环境变量读取
	envSize := os.Getenv(envMaxUploadSize)
	if envSize != "" {
		size, err := strconv.ParseInt(envSize, 10, 64)
		if err == nil && size > 0 {
			return size
		}
	}

	// 默认10MB
	return DefaultMaxUploadSize
}

// FormatFileSize 格式化文件大小为人类可读格式
func FormatFileSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// UploadSizeLimitMiddleware 文件上传大小限制中间件
func UploadSizeLimitMiddleware() gin.HandlerFunc {
	maxSize := GetMaxUploadSize()

	return func(c *gin.Context) {
		// 检查 Content-Length 头
		if c.Request.ContentLength > maxSize {
			response.PayloadTooLargeError(c, FormatFileSize(maxSize))
			c.Abort()
			return
		}

		// 检查 Multipart 表单大小
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)

		c.Set("upload_max_size", maxSize)
		c.Next()
	}
}

// ImageUploadConfig 图片上传配置
type ImageUploadConfig struct {
	MaxSize      int64
	AllowedTypes []string
}

// DefaultImageConfig 默认图片配置
func DefaultImageConfig() ImageUploadConfig {
	return ImageUploadConfig{
		MaxSize:      5 * 1024 * 1024, // 5MB
		AllowedTypes: []string{"image/jpeg", "image/png", "image/gif", "image/webp"},
	}
}

// ValidateImageUpload 验证图片上传
func ValidateImageUpload(contentType string, size int64, config ImageUploadConfig) error {
	// 检查文件大小
	if size > config.MaxSize {
		return fmt.Errorf("image size %.2f MB exceeds maximum limit of %s",
			float64(size)/(1024*1024),
			FormatFileSize(config.MaxSize))
	}

	// 检查文件类型
	validType := false
	for _, allowedType := range config.AllowedTypes {
		if contentType == allowedType {
			validType = true
			break
		}
	}

	if !validType {
		return fmt.Errorf("image type '%s' is not allowed. allowed types: %v",
			contentType, config.AllowedTypes)
	}

	return nil
}

// VideoUploadConfig 视频上传配置
type VideoUploadConfig struct {
	MaxSize      int64
	AllowedTypes []string
	MaxDuration  int // 秒
}

// DefaultVideoConfig 默认视频配置
func DefaultVideoConfig() VideoUploadConfig {
	return VideoUploadConfig{
		MaxSize:      100 * 1024 * 1024, // 100MB
		AllowedTypes: []string{"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"},
		MaxDuration:  300,                // 5分钟
	}
}

// DocumentUploadConfig 文档上传配置
type DocumentUploadConfig struct {
	MaxSize      int64
	AllowedTypes []string
}

// DefaultDocumentConfig 默认文档配置
func DefaultDocumentConfig() DocumentUploadConfig {
	return DocumentUploadConfig{
		MaxSize:      20 * 1024 * 1024, // 20MB
		AllowedTypes: []string{
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/plain",
		},
	}
}
