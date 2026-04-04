package service

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

type AuthResult struct {
	Token    string     `json:"token"`
	User     model.User `json:"user"`
	ExpireAt time.Time  `json:"expire_at"`
}

func (s *AuthService) Authenticate(username, password string) (*AuthResult, error) {
	var user model.User
	if err := s.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrAccountDisabled
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	now := time.Now()
	s.db.Model(&user).Update("last_login_at", now)

	token, expireAt, err := generateToken(user.ID, user.Username, user.TenantID)
	if err != nil {
		return nil, err
	}

	return &AuthResult{
		Token:    token,
		User:     user,
		ExpireAt: expireAt,
	}, nil
}

func (s *AuthService) Register(username, email, password string) (*model.User, error) {
	var count int64
	s.db.Model(&model.User{}).Where("username = ? OR email = ?", username, email).Count(&count)
	if count > 0 {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	tenantID := "tenant_" + username

	user := &model.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         "user",
		TenantID:     tenantID,
		IsActive:     true,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) GetUserByID(userID uint) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, ErrNotFound
	}
	return &user, nil
}
