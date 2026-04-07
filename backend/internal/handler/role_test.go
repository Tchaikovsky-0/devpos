package handler

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

	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupRoleHandlerTest(t *testing.T) (*gin.Engine, *service.RoleService) {
	t.Helper()

	// Disable auth so RBAC middleware doesn't block
	os.Setenv("AUTH_ENABLED", "false")
	t.Cleanup(func() { os.Unsetenv("AUTH_ENABLED") })

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s_role?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	db.AutoMigrate(&model.Role{}, &model.User{})

	roleSvc := service.NewRoleService(db)
	roleSvc.SeedDefaultRoles("tenant_test")

	rbacMW := middleware.NewRBACMiddleware(roleSvc)
	h := NewRoleHandler(roleSvc, rbacMW)

	gin.SetMode(gin.TestMode)
	r := gin.New()

	api := r.Group("/api/v1")
	api.Use(func(c *gin.Context) {
		c.Set("user_id", uint(1))
		c.Set("tenant_id", "tenant_test")
		c.Set("role", "admin")
		c.Next()
	})
	h.RegisterRoutes(api)

	return r, roleSvc
}

// ---------- List ----------

func TestRoleHandler_List(t *testing.T) {
	r, _ := setupRoleHandlerTest(t)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/roles", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Code int                      `json:"code"`
		Data []map[string]interface{} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)

	if len(resp.Data) < 4 {
		t.Errorf("expected at least 4 default roles, got %d", len(resp.Data))
	}
}

// ---------- Create ----------

func TestRoleHandler_Create(t *testing.T) {
	r, _ := setupRoleHandlerTest(t)

	payload := map[string]interface{}{
		"name":        "Test Custom Role",
		"code":        "test_custom",
		"description": "A custom role for testing",
		"permissions": []string{"alert:read", "stream:read"},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/roles", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Code int                    `json:"code"`
		Data map[string]interface{} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.Data["name"] != "Test Custom Role" {
		t.Errorf("expected name 'Test Custom Role', got %v", resp.Data["name"])
	}
}

// ---------- AssignRole ----------

func TestRoleHandler_AssignRole(t *testing.T) {
	r, _ := setupRoleHandlerTest(t)

	// Create a user to assign role to
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s_role?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to reopen db: %v", err)
	}
	user := model.User{Username: "assigntest", Email: "assign@test.com", PasswordHash: "x", TenantID: "tenant_test"}
	db.Create(&user)

	payload := map[string]interface{}{"role": "operator"}
	body, _ := json.Marshal(payload)

	url := fmt.Sprintf("/api/v1/users/%d/role", user.ID)
	req := httptest.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	// Verify user role was updated
	var updated model.User
	db.First(&updated, user.ID)
	if updated.Role != "operator" {
		t.Errorf("expected role 'operator', got %q", updated.Role)
	}
}
