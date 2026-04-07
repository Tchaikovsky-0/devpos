package benchmark

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupBenchmarkDB(b *testing.B) (*gin.Engine, *service.StreamService) {
	b.Helper()

	db, _ := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	db.AutoMigrate(&model.Stream{})

	streamService := service.NewStreamService(db)
	streamHandler := handler.NewStreamHandler(streamService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("tenant_id", "tenant_benchmark")
		c.Next()
	})

	router.POST("/streams", streamHandler.Create)
	router.GET("/streams", streamHandler.List)
	router.GET("/streams/:id", streamHandler.GetByID)
	router.PUT("/streams/:id", streamHandler.Update)
	router.DELETE("/streams/:id", streamHandler.Delete)

	return router, streamService
}

func BenchmarkStreamCreate(b *testing.B) {
	router, _ := setupBenchmarkDB(b)

	payload := map[string]interface{}{
		"name": "Benchmark Stream",
		"type": "rtsp",
		"url":  "rtsp://benchmark",
	}
	body, _ := json.Marshal(payload)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest(http.MethodPost, "/streams", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			b.Fatalf("expected status 201, got %d", w.Code)
		}
	}
}

func BenchmarkStreamList(b *testing.B) {
	router, streamService := setupBenchmarkDB(b)

	// Pre-populate with data
	for i := 0; i < 100; i++ {
		streamService.Create("tenant_benchmark", service.CreateStreamRequest{
			Name: "Stream",
			Type: "rtsp",
			URL:  "rtsp://test",
		})
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest(http.MethodGet, "/streams", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			b.Fatalf("expected status 200, got %d", w.Code)
		}
	}
}

func BenchmarkStreamGetByID(b *testing.B) {
	router, streamService := setupBenchmarkDB(b)

	// Create a stream
	stream, _ := streamService.Create("tenant_benchmark", service.CreateStreamRequest{
		Name: "Benchmark Stream",
		Type: "rtsp",
		URL:  "rtsp://benchmark",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest(http.MethodGet, "/streams", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		_ = stream.ID
	}
}

func BenchmarkStreamUpdate(b *testing.B) {
	router, streamService := setupBenchmarkDB(b)

	// Create a stream
	stream, _ := streamService.Create("tenant_benchmark", service.CreateStreamRequest{
		Name: "Original",
		Type: "rtsp",
		URL:  "rtsp://original",
	})

	updatePayload := map[string]interface{}{
		"name": "Updated",
	}
	body, _ := json.Marshal(updatePayload)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest(http.MethodPut, "/streams", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		_ = stream.ID
	}
}

func BenchmarkStreamDelete(b *testing.B) {
	router, streamService := setupBenchmarkDB(b)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Create a stream to delete
		stream, _ := streamService.Create("tenant_benchmark", service.CreateStreamRequest{
			Name: "To Delete",
			Type: "rtsp",
			URL:  "rtsp://delete",
		})

		req := httptest.NewRequest(http.MethodDelete, "/streams", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		_ = stream.ID
	}
}

func BenchmarkConcurrentStreamOperations(b *testing.B) {
	_, streamService := setupBenchmarkDB(b)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			streamService.Create("tenant_benchmark", service.CreateStreamRequest{
				Name: "Concurrent Stream",
				Type: "rtsp",
				URL:  "rtsp://concurrent",
			})
		}
	})
}
