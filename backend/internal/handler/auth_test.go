package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupTestRouter(t *testing.T) (*gin.Engine, *service.AuthService) {
	t.Helper()

	// Setup test database
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	db.AutoMigrate(&model.User{})

	// Create services
	authService := service.NewAuthService(db)
	authHandler := NewAuthHandler(authService)

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Routes
	router.POST("/api/v1/auth/login", authHandler.Login)
	router.POST("/api/v1/auth/register", authHandler.Register)

	return router, authService
}

func TestAuthHandler_Register(t *testing.T) {
	router, _ := setupTestRouter(t)

	tests := []struct {
		name           string
		payload        map[string]string
		expectedStatus int
		description    string
	}{
		{
			name: "successful registration",
			payload: map[string]string{
				"username": "newuser",
				"email":    "newuser@example.com",
				"password": "secureSecurePass123",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "missing username",
			payload: map[string]string{
				"email":    "test@example.com",
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing email",
			payload: map[string]string{
				"username": "testuser",
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing password",
			payload: map[string]string{
				"username": "testuser",
				"email":    "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "password too short",
			payload: map[string]string{
				"username": "testuser",
				"email":    "test@example.com",
				"password": "12345",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "invalid email",
			payload: map[string]string{
				"username": "testuser",
				"email":    "invalid-email",
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
		})
	}
}

func TestAuthHandler_Login(t *testing.T) {
	router, authService := setupTestRouter(t)

	// Register a test user first
	_, err := authService.Register("testuser", "test@example.com", "SecurePass123")
	if err != nil {
		t.Fatalf("failed to register test user: %v", err)
	}

	tests := []struct {
		name           string
		payload        map[string]string
		expectedStatus int
		description    string
	}{
		{
			name: "successful login",
			payload: map[string]string{
				"username": "testuser",
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "wrong password",
			payload: map[string]string{
				"username": "testuser",
				"password": "wrongpassword",
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "non-existent user",
			payload: map[string]string{
				"username": "nonexistent",
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "missing username",
			payload: map[string]string{
				"password": "SecurePass123",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing password",
			payload: map[string]string{
				"username": "testuser",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}

			// Check response structure for successful login
			if tt.expectedStatus == http.StatusOK {
				var response struct {
					Code    int                    `json:"code"`
					Message string                 `json:"message"`
					Data    map[string]interface{} `json:"data"`
				}
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Errorf("failed to parse response: %v", err)
					return
				}
				if response.Code != 200 {
					t.Errorf("expected response code 200, got %d", response.Code)
				}
				if response.Data["token"] == "" {
					t.Error("expected token in response")
				}
			}
		})
	}
}

func TestAuthHandler_Login_ResponseStructure(t *testing.T) {
	router, authService := setupTestRouter(t)

	// Register and login
	_, _ = authService.Register("responseuser", "response@example.com", "SecurePass123")

	body, _ := json.Marshal(map[string]string{
		"username": "responseuser",
		"password": "SecurePass123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var response struct {
		Code    int                    `json:"code"`
		Message string                 `json:"message"`
		Data    map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response.Code != 200 {
		t.Errorf("expected code 200, got %d", response.Code)
	}
	if response.Message != "success" {
		t.Errorf("expected message 'success', got %s", response.Message)
	}
	if response.Data["token"] == "" {
		t.Error("expected token in response")
	}
	if response.Data["user"] == nil {
		t.Error("expected user in response")
	}
	if response.Data["expire_at"] == nil {
		t.Error("expected expire_at in response")
	}
}
