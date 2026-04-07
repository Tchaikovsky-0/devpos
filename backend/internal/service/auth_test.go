package service

import (
	"fmt"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	// Auto migrate all models
	err = db.AutoMigrate(
		&model.User{},
		&model.Stream{},
		&model.Alert{},
		&model.YOLODetection{},
		&model.Media{},
		&model.MediaFolder{},
	)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	return db
}

func TestAuthService_Authenticate(t *testing.T) {
	db := setupTestDB(t)
	service := NewAuthService(db)

	// Create a test user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("testpassword123"), bcrypt.DefaultCost)
	user := &model.User{
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: string(hashedPassword),
		Role:         "user",
		TenantID:     "tenant_test",
		IsActive:     true,
	}
	db.Create(user)

	tests := []struct {
		name        string
		username    string
		password    string
		wantErr     bool
		errType     error
		description string
	}{
		{
			name:        "successful authentication",
			username:    "testuser",
			password:    "testpassword123",
			wantErr:     false,
			description: "Valid credentials should succeed",
		},
		{
			name:        "wrong password",
			username:    "testuser",
			password:    "wrongpassword",
			wantErr:     true,
			errType:     ErrInvalidCredentials,
			description: "Wrong password should return ErrInvalidCredentials",
		},
		{
			name:        "non-existent user",
			username:    "nonexistent",
			password:    "somepassword",
			wantErr:     true,
			errType:     ErrInvalidCredentials,
			description: "Non-existent user should return ErrInvalidCredentials",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Authenticate(tt.username, tt.password)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error type %v, got %v", tt.errType, err)
				}
				if result != nil {
					t.Errorf("expected nil result, got %+v", result)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if result == nil {
					t.Error("expected result but got nil")
					return
				}
				if result.User.Username != tt.username {
					t.Errorf("expected username %s, got %s", tt.username, result.User.Username)
				}
				if result.Token == "" {
					t.Error("expected token but got empty string")
				}
				if result.ExpireAt.Before(time.Now()) {
					t.Error("expected future expire_at")
				}
			}
		})
	}
}


func TestAuthService_Register(t *testing.T) {
	db := setupTestDB(t)
	service := NewAuthService(db)

	tests := []struct {
		name        string
		username    string
		email       string
		password    string
		wantErr     bool
		errType     error
		description string
	}{
		{
			name:        "successful registration",
			username:    "newuser",
			email:       "newuser@example.com",
			password:    "SecurePass123",
			wantErr:     false,
			description: "Valid registration should succeed",
		},
		{
			name:        "duplicate username",
			username:    "existinguser",
			email:       "unique@example.com",
			password:    "SecurePass123",
			wantErr:     true,
			errType:     ErrUserExists,
			description: "Duplicate username should fail",
		},
		{
			name:        "duplicate email",
			username:    "uniqueuser",
			email:       "existing@example.com",
			password:    "SecurePass123",
			wantErr:     true,
			errType:     ErrUserExists,
			description: "Duplicate email should fail",
		},
	}

	// Create existing user for duplicate tests
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("testpassword123"), bcrypt.DefaultCost)
	db.Create(&model.User{
		Username:     "existinguser",
		Email:        "existing@example.com",
		PasswordHash: string(hashedPassword),
		Role:         "user",
		TenantID:     "tenant_test",
		IsActive:     true,
	})

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := service.Register(tt.username, tt.email, tt.password)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error type %v, got %v", tt.errType, err)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if user == nil {
					t.Error("expected user but got nil")
					return
				}
				if user.Username != tt.username {
					t.Errorf("expected username %s, got %s", tt.username, user.Username)
				}
				if user.Email != tt.email {
					t.Errorf("expected email %s, got %s", tt.email, user.Email)
				}
				if user.Role != "user" {
					t.Errorf("expected role 'user', got %s", user.Role)
				}
				if !user.IsActive {
					t.Error("expected user to be active")
				}
			}
		})
	}
}

func TestAuthService_GetUserByID(t *testing.T) {
	db := setupTestDB(t)
	service := NewAuthService(db)

	// Create test user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("testpassword123"), bcrypt.DefaultCost)
	user := &model.User{
		Username:     "finduser",
		Email:        "find@example.com",
		PasswordHash: string(hashedPassword),
		Role:         "user",
		TenantID:     "tenant_test",
		IsActive:     true,
	}
	db.Create(user)

	tests := []struct {
		name    string
		userID  uint
		wantErr bool
	}{
		{
			name:    "existing user",
			userID:  user.ID,
			wantErr: false,
		},
		{
			name:    "non-existent user",
			userID:  99999,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.GetUserByID(tt.userID)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
				if err != ErrNotFound {
					t.Errorf("expected ErrNotFound, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if result.ID != user.ID {
					t.Errorf("expected user ID %d, got %d", user.ID, result.ID)
				}
			}
		})
	}
}
