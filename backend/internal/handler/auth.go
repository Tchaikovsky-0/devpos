package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=64"`
	Password string `json:"password" binding:"required,min=6"`
	Email    string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.authService.Authenticate(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			response.Unauthorized(c, "invalid credentials")
			return
		}
		if errors.Is(err, service.ErrAccountDisabled) {
			response.Forbidden(c, "account is disabled")
			return
		}
		response.InternalError(c, "login failed")
		return
	}

	response.Success(c, result)
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			response.BadRequest(c, "username or email already exists")
			return
		}
		response.InternalError(c, "failed to create user")
		return
	}

	c.JSON(http.StatusCreated, response.Response{
		Code:    201,
		Message: "created",
		Data:    result,
	})
}

func (h *AuthHandler) GetUserInfo(c *gin.Context) {
	userID := c.GetUint("user_id")

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	response.Success(c, user)
}

// HashPassword is defined in utils.go
// Kept for backward compatibility; new code should use service.AuthService
