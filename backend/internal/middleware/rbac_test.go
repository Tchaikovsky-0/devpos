package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupRBACTest(t *testing.T) (*RBACMiddleware, *gin.Engine) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	db.AutoMigrate(&model.Role{}, &model.User{})

	roleSvc := service.NewRoleService(db)
	roleSvc.SeedDefaultRoles("tenant_test")

	rbacMW := NewRBACMiddleware(roleSvc)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	return rbacMW, r
}

func TestRequirePermission_Allowed(t *testing.T) {
	// Ensure auth is enabled for this test
	os.Setenv("AUTH_ENABLED", "true")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	r.GET("/test", func(c *gin.Context) {
		c.Set("tenant_id", "tenant_test")
		c.Set("role", "admin")
		c.Next()
	}, rbac.RequirePermission("alert:read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestRequirePermission_Denied(t *testing.T) {
	os.Setenv("AUTH_ENABLED", "true")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	r.GET("/test", func(c *gin.Context) {
		c.Set("tenant_id", "tenant_test")
		c.Set("role", "viewer")
		c.Next()
	}, rbac.RequirePermission("alert:delete"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["message"] != "insufficient permissions" {
		t.Errorf("unexpected message: %v", resp["message"])
	}
}

func TestRequireAnyPermission_Allowed(t *testing.T) {
	os.Setenv("AUTH_ENABLED", "true")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	r.GET("/test", func(c *gin.Context) {
		c.Set("tenant_id", "tenant_test")
		c.Set("role", "viewer")
		c.Next()
	}, rbac.RequireAnyPermission("alert:delete", "alert:read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 (viewer has alert:read), got %d", w.Code)
	}
}

func TestRequireAnyPermission_AllDenied(t *testing.T) {
	os.Setenv("AUTH_ENABLED", "true")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	r.GET("/test", func(c *gin.Context) {
		c.Set("tenant_id", "tenant_test")
		c.Set("role", "viewer")
		c.Next()
	}, rbac.RequireAnyPermission("alert:delete", "role:delete"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestDevModeBypass(t *testing.T) {
	// Disable auth (dev mode)
	os.Setenv("AUTH_ENABLED", "false")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	r.GET("/test", rbac.RequirePermission("system:update"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 in dev mode (auth disabled), got %d", w.Code)
	}
}

func TestRequirePermission_MissingContext(t *testing.T) {
	os.Setenv("AUTH_ENABLED", "true")
	defer os.Unsetenv("AUTH_ENABLED")

	rbac, r := setupRBACTest(t)

	// No tenant_id or role set in context
	r.GET("/test", rbac.RequirePermission("alert:read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403 for missing context, got %d", w.Code)
	}
}
