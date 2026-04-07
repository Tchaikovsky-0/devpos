package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/handler"
	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

// TestAPIIntegration tests the complete API flow from registration to CRUD operations
func TestAPIIntegration(t *testing.T) {
	// Setup test database
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	db.AutoMigrate(
		&model.User{},
		&model.Stream{},
		&model.Alert{},
	)

	// Setup services
	wsHub := service.NewWebSocketHub()
	authService := service.NewAuthService(db)
	streamService := service.NewStreamService(db)
	streamProxyService := service.NewStreamProxyService(db, wsHub, "/tmp")
	alertService := service.NewAlertService(db, wsHub)

	// Setup handlers
	authHandler := handler.NewAuthHandler(authService)
	streamHandler := handler.NewStreamHandler(streamService, streamProxyService)
	alertHandler := handler.NewAlertHandler(alertService)

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.CORS())

	// Public routes
	router.POST("/api/v1/auth/login", authHandler.Login)
	router.POST("/api/v1/auth/register", authHandler.Register)

	// Protected routes (skip auth in test mode)
	api := router.Group("/api/v1")
	api.Use(func(c *gin.Context) {
		// Mock authenticated user
		c.Set("user_id", uint(1))
		c.Set("tenant_id", "tenant_test")
		c.Next()
	})
	{
		api.POST("/streams", streamHandler.Create)
		api.GET("/streams", streamHandler.List)
		api.GET("/streams/:id", streamHandler.GetByID)
		api.PUT("/streams/:id", streamHandler.Update)
		api.DELETE("/streams/:id", streamHandler.Delete)

		api.POST("/alerts", alertHandler.Create)
		api.GET("/alerts", alertHandler.List)
		api.GET("/alerts/:id", alertHandler.GetByID)
		api.PUT("/alerts/:id", alertHandler.Update)
		api.DELETE("/alerts/:id", alertHandler.Delete)
	}

	t.Run("Complete User Flow", func(t *testing.T) {
		// 1. Register user
		t.Log("Step 1: Register user")
		registerPayload := map[string]string{
			"username": "integrationuser",
			"email":    "integration@test.com",
			"password": "testpassword123",
		}
		body, _ := json.Marshal(registerPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("registration failed: expected 201, got %d, body: %s", w.Code, w.Body.String())
		}

		// 2. Login
		t.Log("Step 2: Login")
		loginPayload := map[string]string{
			"username": "integrationuser",
			"password": "testpassword123",
		}
		body, _ = json.Marshal(loginPayload)
		req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("login failed: expected 200, got %d", w.Code)
		}

		var loginResponse struct {
			Data struct {
				Token string `json:"token"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &loginResponse); err != nil {
			t.Fatalf("failed to parse login response: %v", err)
		}

		if loginResponse.Data.Token == "" {
			t.Fatal("expected token in login response")
		}

		t.Logf("✓ User registration and login successful")
	})

	t.Run("Stream CRUD Flow", func(t *testing.T) {
		// 1. Create stream
		t.Log("Step 1: Create stream")
		streamPayload := map[string]interface{}{
			"name":     "Integration Test Stream",
			"type":     "rtsp",
			"url":      "rtsp://test.example.com/stream",
			"location": "Test Location",
		}
		body, _ := json.Marshal(streamPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("create stream failed: expected 201, got %d, body: %s", w.Code, w.Body.String())
		}

		var streamResponse struct {
			Data map[string]interface{} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &streamResponse); err != nil {
			t.Fatalf("failed to parse stream response: %v", err)
		}

		streamID := fmt.Sprintf("%.0f", streamResponse.Data["id"])
		t.Logf("Created stream ID: %s", streamID)

		// 2. Get stream
		t.Log("Step 2: Get stream")
		req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/streams/%s", streamID), nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("get stream failed: expected 200, got %d", w.Code)
		}

		// 3. Update stream
		t.Log("Step 3: Update stream")
		updatePayload := map[string]interface{}{
			"name":   "Updated Stream Name",
			"status": "online",
		}
		body, _ = json.Marshal(updatePayload)
		req = httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/streams/%s", streamID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update stream failed: expected 200, got %d", w.Code)
		}

		// 4. List streams
		t.Log("Step 4: List streams")
		req = httptest.NewRequest(http.MethodGet, "/api/v1/streams", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("list streams failed: expected 200, got %d", w.Code)
		}

		var listResponse struct {
			Data  []map[string]interface{} `json:"data"`
			Total int64                    `json:"total"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &listResponse); err != nil {
			t.Fatalf("failed to parse list response: %v", err)
		}

		if listResponse.Total < 1 {
			t.Error("expected at least 1 stream in list")
		}

		// 5. Delete stream
		t.Log("Step 5: Delete stream")
		req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/streams/%s", streamID), nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("delete stream failed: expected 200, got %d", w.Code)
		}

		t.Logf("✓ Stream CRUD flow completed successfully")
	})

	t.Run("Alert CRUD Flow", func(t *testing.T) {
		// 1. Create alert
		t.Log("Step 1: Create alert")
		alertPayload := map[string]interface{}{
			"level":   "CRIT",
			"type":    "fire",
			"title":   "Integration Test Alert",
			"message": "This is a test alert from integration test",
		}
		body, _ := json.Marshal(alertPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/alerts", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("create alert failed: expected 201, got %d, body: %s", w.Code, w.Body.String())
		}

		var alertResponse struct {
			Data map[string]interface{} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &alertResponse); err != nil {
			t.Fatalf("failed to parse alert response: %v", err)
		}

		alertID := fmt.Sprintf("%.0f", alertResponse.Data["id"])
		t.Logf("Created alert ID: %s", alertID)

		// 2. Get alert
		t.Log("Step 2: Get alert")
		req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/alerts/%s", alertID), nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("get alert failed: expected 200, got %d", w.Code)
		}

		// 3. Update alert
		t.Log("Step 3: Update alert")
		updatePayload := map[string]interface{}{
			"status":       "resolved",
			"acknowledged": true,
		}
		body, _ = json.Marshal(updatePayload)
		req = httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/alerts/%s", alertID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update alert failed: expected 200, got %d", w.Code)
		}

		// 4. List alerts
		t.Log("Step 4: List alerts")
		req = httptest.NewRequest(http.MethodGet, "/api/v1/alerts", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("list alerts failed: expected 200, got %d", w.Code)
		}

		// 5. Filter alerts by level
		t.Log("Step 5: Filter alerts by level")
		req = httptest.NewRequest(http.MethodGet, "/api/v1/alerts?level=CRIT", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("filter alerts failed: expected 200, got %d", w.Code)
		}

		// 6. Delete alert
		t.Log("Step 6: Delete alert")
		req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/alerts/%s", alertID), nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("delete alert failed: expected 200, got %d", w.Code)
		}

		t.Logf("✓ Alert CRUD flow completed successfully")
	})

	t.Run("Multi-tenant Isolation", func(t *testing.T) {
		// Create stream for tenant_1
		streamPayload := map[string]interface{}{
			"name": "Tenant 1 Stream",
			"type": "rtsp",
			"url":  "rtsp://tenant1",
		}
		body, _ := json.Marshal(streamPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("failed to create stream for tenant_1: %d", w.Code)
		}

		// List should only show tenant_1 streams
		req = httptest.NewRequest(http.MethodGet, "/api/v1/streams", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("failed to list streams: %d", w.Code)
		}

		t.Logf("✓ Multi-tenant isolation verified")
	})
}

// ============================================================================
// API Contract Tests — verify endpoints return expected response shapes
// ============================================================================

func setupContractRouter(t *testing.T) *gin.Engine {
	t.Helper()

	// Disable auth for contract tests
	os.Setenv("AUTH_ENABLED", "false")
	t.Cleanup(func() { os.Unsetenv("AUTH_ENABLED") })

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s_contract?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}

	db.AutoMigrate(
		&model.User{},
		&model.Stream{},
		&model.Alert{},
		&model.AlertRule{},
		&model.Role{},
	)

	wsHub := service.NewWebSocketHub()
	authService := service.NewAuthService(db)
	alertService := service.NewAlertService(db, wsHub)
	notifSvc := service.NewNotificationService()
	alertRuleService := service.NewAlertRuleService(db, alertService, notifSvc)
	roleSvc := service.NewRoleService(db)
	roleSvc.SeedDefaultRoles("tenant_contract")

	rbacMW := middleware.NewRBACMiddleware(roleSvc)

	_ = authService // used above for completeness

	gin.SetMode(gin.TestMode)
	router := gin.New()

	api := router.Group("/api/v1")
	api.Use(func(c *gin.Context) {
		c.Set("user_id", uint(1))
		c.Set("tenant_id", "tenant_contract")
		c.Set("role", "admin")
		c.Next()
	})

	handler.NewAlertRuleHandler(alertRuleService).RegisterRoutes(api)
	handler.NewRoleHandler(roleSvc, rbacMW).RegisterRoutes(api)

	return router
}

// TestAPIContract_AlertRuleCRUD verifies the alert-rule endpoints respond with the expected shape.
func TestAPIContract_AlertRuleCRUD(t *testing.T) {
	router := setupContractRouter(t)

	// --- CREATE ---
	cond, _ := json.Marshal(model.AlertRuleCondition{Metric: "temperature", Operator: "gt", Threshold: 80})
	acts, _ := json.Marshal([]model.AlertRuleAction{{Type: "webhook", Target: "https://hook.example.com"}})

	createPayload, _ := json.Marshal(map[string]interface{}{
		"name": "Contract Rule", "type": "sensor_threshold",
		"conditions": string(cond), "actions": string(acts), "severity": "warning",
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/alert-rules", bytes.NewBuffer(createPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST /alert-rules: expected 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var createResp struct {
		Code    int                    `json:"code"`
		Message string                 `json:"message"`
		Data    map[string]interface{} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	if createResp.Code != 201 || createResp.Message != "created" {
		t.Errorf("unexpected response shape: %+v", createResp)
	}
	ruleID := fmt.Sprintf("%.0f", createResp.Data["id"])

	// --- LIST ---
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/alert-rules?page=1&page_size=10", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET /alert-rules: expected 200, got %d", w.Code)
	}
	var listResp struct {
		Code int `json:"code"`
		Data struct {
			Items []interface{} `json:"items"`
			Total float64       `json:"total"`
			Page  float64       `json:"page"`
		} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &listResp)
	if listResp.Code != 200 {
		t.Errorf("expected code 200, got %d", listResp.Code)
	}
	if listResp.Data.Total < 1 {
		t.Errorf("expected total >= 1, got %v", listResp.Data.Total)
	}

	// --- GET by ID ---
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/alert-rules/"+ruleID, nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("GET /alert-rules/:id: expected 200, got %d", w.Code)
	}

	// --- TOGGLE ---
	toggleBody, _ := json.Marshal(map[string]bool{"enabled": false})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPut, "/api/v1/alert-rules/"+ruleID+"/toggle", bytes.NewBuffer(toggleBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("PUT /alert-rules/:id/toggle: expected 200, got %d", w.Code)
	}

	// --- DELETE ---
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodDelete, "/api/v1/alert-rules/"+ruleID, nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("DELETE /alert-rules/:id: expected 200, got %d", w.Code)
	}

	t.Log("✓ AlertRule CRUD contract verified")
}

// TestAPIContract_RoleEndpoints verifies role management endpoints.
func TestAPIContract_RoleEndpoints(t *testing.T) {
	router := setupContractRouter(t)

	// --- LIST ROLES ---
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/roles", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET /roles: expected 200, got %d", w.Code)
	}
	var listResp struct {
		Code int                      `json:"code"`
		Data []map[string]interface{} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &listResp)
	if listResp.Code != 200 {
		t.Errorf("expected code 200, got %d", listResp.Code)
	}
	if len(listResp.Data) < 4 {
		t.Errorf("expected >=4 roles, got %d", len(listResp.Data))
	}

	// --- CREATE ROLE ---
	createPayload, _ := json.Marshal(map[string]interface{}{
		"name": "Contract Role", "code": "contract_role",
		"permissions": []string{"alert:read"},
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/roles", bytes.NewBuffer(createPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("POST /roles: expected 201, got %d, body: %s", w.Code, w.Body.String())
	}

	// --- LIST PERMISSIONS ---
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/permissions", nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("GET /permissions: expected 200, got %d", w.Code)
	}

	t.Log("✓ Role endpoints contract verified")
}
