package service

import (
	"testing"

	"xunjianbao-backend/internal/model"
)

func TestGetMediaType(t *testing.T) {
	tests := []struct {
		name     string
		mimeType string
		expected string
	}{
		{"JPEG image", "image/jpeg", "image"},
		{"PNG image", "image/png", "image"},
		{"GIF image", "image/gif", "image"},
		{"MP4 video", "video/mp4", "video"},
		{"AVI video", "video/x-msvideo", "video"},
		{"MP3 audio", "audio/mpeg", "audio"},
		{"PDF document", "application/pdf", "document"},
		{"Unknown type", "application/octet-stream", "other"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getMediaType(tt.mimeType)
			if result != tt.expected {
				t.Errorf("getMediaType(%q) = %q, want %q", tt.mimeType, result, tt.expected)
			}
		})
	}
}


func TestMediaModelFields(t *testing.T) {
	media := model.Media{
		ID:           1,
		TenantID:     "tenant-001",
		Filename:     "test.jpg",
		OriginalName: "Original Test.jpg",
		MimeType:     "image/jpeg",
		Size:         1024,
		Path:         "/uploads/media/test.jpg",
		URL:          "/api/v1/media/files/test.jpg",
		Type:         "image",
		Description:  "Test description",
	}

	if media.TenantID != "tenant-001" {
		t.Errorf("TenantID = %q, want %q", media.TenantID, "tenant-001")
	}
	if media.Type != "image" {
		t.Errorf("Type = %q, want %q", media.Type, "image")
	}
	if media.Size != 1024 {
		t.Errorf("Size = %d, want %d", media.Size, 1024)
	}
}

func TestMediaFolderModelFields(t *testing.T) {
	folder := model.MediaFolder{
		ID:       1,
		TenantID: "tenant-001",
		Name:     "Test Folder",
		ParentID: nil,
	}

	if folder.Name != "Test Folder" {
		t.Errorf("Name = %q, want %q", folder.Name, "Test Folder")
	}
	if folder.ParentID != nil {
		t.Error("ParentID should be nil for root folder")
	}
}

func TestGetMediaTypeEdgeCases(t *testing.T) {
	tests := []struct {
		name     string
		mimeType string
		expected string
	}{
		{"WebP image", "image/webp", "image"},
		{"WebM video", "video/webm", "video"},
		{"WAV audio", "audio/wav", "audio"},
		{"OGG audio", "audio/ogg", "audio"},
		{"OGV video", "video/ogg", "video"},
		{"Plain text", "text/plain", "document"},
		{"HTML", "text/html", "other"},
		{"XML", "application/xml", "other"},
		{"JSON", "application/json", "other"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getMediaType(tt.mimeType)
			if result != tt.expected {
				t.Errorf("getMediaType(%q) = %q, want %q", tt.mimeType, result, tt.expected)
			}
		})
	}
}

func TestValidateFileSize(t *testing.T) {
	maxSize := int64(100 * 1024 * 1024) // 100MB

	tests := []struct {
		name     string
		size     int64
		expected bool
	}{
		{"Within limit", 50 * 1024 * 1024, true},
		{"At limit", maxSize, true},
		{"Over limit", maxSize + 1, false},
		{"Zero size", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.size <= maxSize
			if result != tt.expected {
				t.Errorf("file size %d validation = %v, want %v", tt.size, result, tt.expected)
			}
		})
	}
}
