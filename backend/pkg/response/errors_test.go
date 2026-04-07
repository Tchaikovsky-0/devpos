package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestAPIError(t *testing.T) {
	err := NewAPIError(ErrCodeBadRequest, CategoryValidation, "test error")

	if err.Success != false {
		t.Errorf("Expected Success to be false, got %v", err.Success)
	}

	if err.Err.Code != ErrCodeBadRequest {
		t.Errorf("Expected code %d, got %d", ErrCodeBadRequest, err.Err.Code)
	}

	if err.Err.Category != CategoryValidation {
		t.Errorf("Expected category %s, got %s", CategoryValidation, err.Err.Category)
	}

	if err.Err.Message != "test error" {
		t.Errorf("Expected message 'test error', got '%s'", err.Err.Message)
	}
}

func TestAPIErrorWithDetail(t *testing.T) {
	err := NewAPIError(ErrCodeValidationError, CategoryValidation, "validation failed").
		WithDetail("field 'username' is required").
		WithField("username")

	if err.Err.Detail != "field 'username' is required" {
		t.Errorf("Expected detail 'field username is required', got '%s'", err.Err.Detail)
	}

	if err.Err.Field != "username" {
		t.Errorf("Expected field 'username', got '%s'", err.Err.Field)
	}
}

func TestAPIErrorString(t *testing.T) {
	err := NewAPIError(ErrCodeNotFound, CategoryResource, "resource not found")
	expected := "code=404, category=resource, message=resource not found"

	if err.Error() != expected {
		t.Errorf("Expected error string '%s', got '%s'", expected, err.Error())
	}
}

func TestBadRequestError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	BadRequestError(c, "invalid input")

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Success != false {
		t.Errorf("Expected Success to be false")
	}

	if resp.Err.Code != ErrCodeBadRequest {
		t.Errorf("Expected code %d, got %d", ErrCodeBadRequest, resp.Err.Code)
	}
}

func TestValidationError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	ValidationError(c, "email", "invalid email format")

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeValidationError {
		t.Errorf("Expected code %d, got %d", ErrCodeValidationError, resp.Err.Code)
	}

	if resp.Err.Category != CategoryValidation {
		t.Errorf("Expected category %s, got %s", CategoryValidation, resp.Err.Category)
	}

	if resp.Err.Field != "email" {
		t.Errorf("Expected field 'email', got '%s'", resp.Err.Field)
	}
}

func TestUnauthorizedError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	UnauthorizedError(c, "invalid token")

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeUnauthorized {
		t.Errorf("Expected code %d, got %d", ErrCodeUnauthorized, resp.Err.Code)
	}

	if resp.Err.Category != CategoryAuth {
		t.Errorf("Expected category %s, got %s", CategoryAuth, resp.Err.Category)
	}
}

func TestForbiddenError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	ForbiddenError(c, "insufficient permissions")

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected status %d, got %d", http.StatusForbidden, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeForbidden {
		t.Errorf("Expected code %d, got %d", ErrCodeForbidden, resp.Err.Code)
	}
}

func TestNotFoundError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	NotFoundError(c, "user")

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeNotFound {
		t.Errorf("Expected code %d, got %d", ErrCodeNotFound, resp.Err.Code)
	}

	expectedMessage := "user not found"
	if resp.Err.Message != expectedMessage {
		t.Errorf("Expected message '%s', got '%s'", expectedMessage, resp.Err.Message)
	}
}

func TestPayloadTooLargeError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	PayloadTooLargeError(c, "10MB")

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected status %d, got %d", http.StatusRequestEntityTooLarge, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodePayloadTooLarge {
		t.Errorf("Expected code %d, got %d", ErrCodePayloadTooLarge, resp.Err.Code)
	}
}

func TestInternalServerError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	InternalServerError(c, "database connection failed")

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeInternalError {
		t.Errorf("Expected code %d, got %d", ErrCodeInternalError, resp.Err.Code)
	}
}

func TestSuccessData(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"key": "value"}
	SuccessData(c, data)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp SuccessResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Success != true {
		t.Errorf("Expected Success to be true")
	}

	if resp.Code != ErrCodeSuccess {
		t.Errorf("Expected code %d, got %d", ErrCodeSuccess, resp.Code)
	}
}

func TestCreatedData(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]int{"id": 1}
	CreatedData(c, data)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var resp SuccessResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Success != true {
		t.Errorf("Expected Success to be true")
	}

	if resp.Message != "created" {
		t.Errorf("Expected message 'created', got '%s'", resp.Message)
	}
}

func TestFileTooLargeError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	FileTooLargeError(c, "15MB", "10MB")

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected status %d, got %d", http.StatusRequestEntityTooLarge, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeFileTooLarge {
		t.Errorf("Expected code %d, got %d", ErrCodeFileTooLarge, resp.Err.Code)
	}
}

func TestInvalidFileTypeError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	InvalidFileTypeError(c, "application/pdf", []string{"image/jpeg", "image/png"})

	if w.Code != http.StatusUnsupportedMediaType {
		t.Errorf("Expected status %d, got %d", http.StatusUnsupportedMediaType, w.Code)
	}

	var resp APIError
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Err.Code != ErrCodeInvalidFileType {
		t.Errorf("Expected code %d, got %d", ErrCodeInvalidFileType, resp.Err.Code)
	}
}
