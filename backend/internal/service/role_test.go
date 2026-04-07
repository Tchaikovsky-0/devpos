package service

import (
	"testing"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

func setupRoleTestDB(t *testing.T) (*RoleService, *gorm.DB) {
	t.Helper()
	db := setupTestDB(t)
	if err := db.AutoMigrate(&model.Role{}); err != nil {
		t.Fatalf("failed to migrate role models: %v", err)
	}
	svc := NewRoleService(db)
	return svc, db
}

// ---------- SeedDefaultRoles ----------

func TestSeedDefaultRoles(t *testing.T) {
	svc, db := setupRoleTestDB(t)

	if err := svc.SeedDefaultRoles("tenant_1"); err != nil {
		t.Fatalf("SeedDefaultRoles failed: %v", err)
	}

	var roles []model.Role
	db.Where("tenant_id = ?", "tenant_1").Find(&roles)

	if len(roles) != 4 {
		t.Fatalf("expected 4 default roles, got %d", len(roles))
	}

	expectedCodes := map[string]bool{
		"super_admin": false,
		"admin":       false,
		"operator":    false,
		"viewer":      false,
	}
	for _, role := range roles {
		if _, ok := expectedCodes[role.Code]; !ok {
			t.Errorf("unexpected role code: %s", role.Code)
		}
		expectedCodes[role.Code] = true
		if !role.IsSystem {
			t.Errorf("expected role %s to be system role", role.Code)
		}
	}
	for code, found := range expectedCodes {
		if !found {
			t.Errorf("expected default role %s not found", code)
		}
	}

	// Calling again should be idempotent
	if err := svc.SeedDefaultRoles("tenant_1"); err != nil {
		t.Fatalf("second SeedDefaultRoles failed: %v", err)
	}
	var count int64
	db.Model(&model.Role{}).Where("tenant_id = ?", "tenant_1").Count(&count)
	if count != 4 {
		t.Errorf("expected 4 roles after idempotent seed, got %d", count)
	}
}

// ---------- HasPermission ----------

func TestHasPermission_AdminHasAlertRead(t *testing.T) {
	svc, _ := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	has, err := svc.HasPermission("tenant_1", "admin", "alert:read")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !has {
		t.Error("expected admin to have 'alert:read' permission")
	}
}

func TestHasPermission_ViewerNoAlertDelete(t *testing.T) {
	svc, _ := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	has, err := svc.HasPermission("tenant_1", "viewer", "alert:delete")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if has {
		t.Error("expected viewer NOT to have 'alert:delete' permission")
	}
}

func TestHasPermission_SuperAdminHasAll(t *testing.T) {
	svc, _ := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	for _, perm := range []string{"alert:delete", "system:update", "role:delete", "user:create"} {
		has, err := svc.HasPermission("tenant_1", "super_admin", perm)
		if err != nil {
			t.Fatalf("unexpected error checking %s: %v", perm, err)
		}
		if !has {
			t.Errorf("expected super_admin to have %q", perm)
		}
	}
}

// ---------- CreateRole ----------

func TestCreateRole_Custom(t *testing.T) {
	svc, _ := setupRoleTestDB(t)

	req := CreateRoleRequest{
		Name:        "Custom Ops",
		Code:        "custom_ops",
		Description: "Custom operator role",
		Permissions: []string{"alert:read", "stream:read"},
	}

	role, err := svc.CreateRole("tenant_1", req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if role.ID == 0 {
		t.Error("expected role.ID > 0")
	}
	if role.Name != "Custom Ops" {
		t.Errorf("expected name 'Custom Ops', got %q", role.Name)
	}
	if role.IsSystem {
		t.Error("expected custom role to not be system role")
	}
}

func TestCreateRole_InvalidPermission(t *testing.T) {
	svc, _ := setupRoleTestDB(t)

	req := CreateRoleRequest{
		Name:        "Bad Role",
		Code:        "bad_role",
		Permissions: []string{"nonexistent:permission"},
	}

	_, err := svc.CreateRole("tenant_1", req)
	if err == nil {
		t.Fatal("expected error for invalid permission, got nil")
	}
}

// ---------- DeleteRole ----------

func TestDeleteRole_SystemRoleCannotBeDeleted(t *testing.T) {
	svc, db := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	var adminRole model.Role
	db.Where("tenant_id = ? AND code = ?", "tenant_1", "admin").First(&adminRole)

	err := svc.DeleteRole("tenant_1", adminRole.ID)
	if err == nil {
		t.Fatal("expected error when deleting system role, got nil")
	}
}

func TestDeleteRole_CustomRoleCanBeDeleted(t *testing.T) {
	svc, _ := setupRoleTestDB(t)

	req := CreateRoleRequest{
		Name:        "Temp Role",
		Code:        "temp_role",
		Permissions: []string{"alert:read"},
	}
	role, _ := svc.CreateRole("tenant_1", req)

	err := svc.DeleteRole("tenant_1", role.ID)
	if err != nil {
		t.Fatalf("unexpected error deleting custom role: %v", err)
	}

	_, err = svc.GetRole("tenant_1", role.ID)
	if err != ErrNotFound {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}

// ---------- PermissionCache ----------

func TestPermissionCache_HitAndInvalidate(t *testing.T) {
	svc, _ := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	// First call — populates cache
	perms1, err := svc.GetPermissionsForRole("tenant_1", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(perms1) == 0 {
		t.Fatal("expected permissions, got empty slice")
	}

	// Second call — should hit cache (same result)
	perms2, err := svc.GetPermissionsForRole("tenant_1", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(perms1) != len(perms2) {
		t.Errorf("cache returned different results: %d vs %d", len(perms1), len(perms2))
	}

	// Invalidate cache
	svc.InvalidateCache("tenant_1", "admin")

	// Third call — should refetch from DB
	perms3, err := svc.GetPermissionsForRole("tenant_1", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(perms3) == 0 {
		t.Error("expected permissions after cache invalidation, got empty")
	}
}

// ---------- HasAnyPermission ----------

func TestHasAnyPermission(t *testing.T) {
	svc, _ := setupRoleTestDB(t)
	svc.SeedDefaultRoles("tenant_1")

	has, err := svc.HasAnyPermission("tenant_1", "viewer", []string{"alert:delete", "alert:read"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !has {
		t.Error("expected viewer to have at least 'alert:read'")
	}

	has, err = svc.HasAnyPermission("tenant_1", "viewer", []string{"alert:delete", "role:delete"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if has {
		t.Error("expected viewer NOT to have 'alert:delete' or 'role:delete'")
	}
}
