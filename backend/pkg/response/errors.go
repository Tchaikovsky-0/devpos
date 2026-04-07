package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorCode 错误码
type ErrorCode int

const (
	// 通用错误 (1000-1999)
	ErrCodeSuccess            ErrorCode = 200
	ErrCodeBadRequest         ErrorCode = 400
	ErrCodeUnauthorized       ErrorCode = 401
	ErrCodeForbidden          ErrorCode = 403
	ErrCodeNotFound           ErrorCode = 404
	ErrCodePayloadTooLarge    ErrorCode = 413
	ErrCodeTooManyRequests    ErrorCode = 429
	ErrCodeInternalError      ErrorCode = 500
	ErrCodeServiceUnavailable ErrorCode = 503

	// 业务错误 (2000-2999)
	ErrCodeBusinessError ErrorCode = 2000

	// 认证授权错误 (3000-3999)
	ErrCodeAuthError         ErrorCode = 3001
	ErrCodeTokenInvalid      ErrorCode = 3002
	ErrCodeTokenExpired      ErrorCode = 3003
	ErrCodeInsufficientPerm  ErrorCode = 3004
	ErrCodeAccountDisabled   ErrorCode = 3005
	ErrCodeUserNotFound      ErrorCode = 3006
	ErrCodeUserExists        ErrorCode = 3007
	ErrCodeInvalidCredential ErrorCode = 3008

	// 验证错误 (5000-5999)
	ErrCodeValidationError ErrorCode = 5001
	ErrCodeInvalidFormat   ErrorCode = 5002
	ErrCodeMissingField    ErrorCode = 5003
	ErrCodeFieldTooLong    ErrorCode = 5004

	// 文件上传错误 (6000-6999)
	ErrCodeFileTooLarge    ErrorCode = 6001
	ErrCodeInvalidFileType ErrorCode = 6002
	ErrCodeUploadFailed    ErrorCode = 6003
	ErrCodeQuotaExceeded   ErrorCode = 6004
	ErrCodeFileNotOnDisk   ErrorCode = 6005

	// 文件夹错误 (6100-6199)
	ErrCodeFolderCycle     ErrorCode = 6101
	ErrCodeFolderDepth     ErrorCode = 6102
	ErrCodeFolderDuplicate ErrorCode = 6103
	ErrCodeFolderNotEmpty  ErrorCode = 6104

	// 批量操作错误 (6200-6299)
	ErrCodeBatchLimitExceeded ErrorCode = 6201
)

// ErrorCategory 错误分类
type ErrorCategory string

const (
	CategoryValidation ErrorCategory = "validation"
	CategoryAuth       ErrorCategory = "auth"
	CategoryResource   ErrorCategory = "resource"
	CategoryBusiness   ErrorCategory = "business"
	CategoryExternal   ErrorCategory = "external"
	CategoryInternal   ErrorCategory = "internal"
)

// ErrorDetail 错误详情
type ErrorDetail struct {
	Code     ErrorCode     `json:"code"`
	Category ErrorCategory `json:"category,omitempty"`
	Message  string        `json:"message"`
	Detail   string        `json:"detail,omitempty"`
	Field    string        `json:"field,omitempty"`
	TraceID  string        `json:"trace_id,omitempty"`
}

// APIError API错误
type APIError struct {
	Success bool        `json:"success"`
	Err     ErrorDetail `json:"error"`
}

func (e APIError) Error() string {
	return fmt.Sprintf("code=%d, category=%s, message=%s", e.Err.Code, e.Err.Category, e.Err.Message)
}

// NewAPIError 创建API错误
func NewAPIError(code ErrorCode, category ErrorCategory, message string) APIError {
	return APIError{
		Success: false,
		Err: ErrorDetail{
			Code:     code,
			Category: category,
			Message:  message,
		},
	}
}

// WithDetail 添加详情
func (e APIError) WithDetail(detail string) APIError {
	e.Err.Detail = detail
	return e
}

// WithField 添加字段
func (e APIError) WithField(field string) APIError {
	e.Err.Field = field
	return e
}

// WithTraceID 添加追踪ID
func (e APIError) WithTraceID(traceID string) APIError {
	e.Err.TraceID = traceID
	return e
}

// SuccessResponse 成功响应
type SuccessResponse struct {
	Success bool        `json:"success"`
	Code    ErrorCode   `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewSuccess 创建成功响应
func NewSuccess(data interface{}) SuccessResponse {
	return SuccessResponse{
		Success: true,
		Code:    ErrCodeSuccess,
		Message: "success",
		Data:    data,
	}
}

// SuccessData 返回成功数据
func SuccessData(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, NewSuccess(data))
}

// CreatedData 创建成功响应
func CreatedData(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, SuccessResponse{
		Success: true,
		Code:    ErrCodeSuccess,
		Message: "created",
		Data:    data,
	})
}

// BadRequestError 400错误
func BadRequestError(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, NewAPIError(
		ErrCodeBadRequest,
		CategoryValidation,
		message,
	))
}

// ValidationError 验证错误
func ValidationError(c *gin.Context, field, message string) {
	c.JSON(http.StatusBadRequest, NewAPIError(
		ErrCodeValidationError,
		CategoryValidation,
		message,
	).WithField(field))
}

// UnauthorizedError 401错误
func UnauthorizedError(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, NewAPIError(
		ErrCodeUnauthorized,
		CategoryAuth,
		message,
	))
}

// AuthError 认证错误
func AuthError(c *gin.Context, code ErrorCode, message string) {
	c.JSON(http.StatusUnauthorized, NewAPIError(
		code,
		CategoryAuth,
		message,
	))
}

// ForbiddenError 403错误
func ForbiddenError(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, NewAPIError(
		ErrCodeForbidden,
		CategoryAuth,
		message,
	))
}

// NotFoundError 404错误
func NotFoundError(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, NewAPIError(
		ErrCodeNotFound,
		CategoryResource,
		fmt.Sprintf("%s not found", resource),
	))
}

// ConflictError 冲突错误
func ConflictError(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, NewAPIError(
		ErrCodeBusinessError,
		CategoryResource,
		message,
	))
}

// PayloadTooLargeError 文件过大错误
func PayloadTooLargeError(c *gin.Context, maxSize string) {
	c.JSON(http.StatusRequestEntityTooLarge, NewAPIError(
		ErrCodePayloadTooLarge,
		CategoryValidation,
		fmt.Sprintf("file size exceeds maximum limit of %s", maxSize),
	))
}

// TooManyRequestsError 请求过多错误
func TooManyRequestsError(c *gin.Context) {
	c.JSON(http.StatusTooManyRequests, NewAPIError(
		ErrCodeTooManyRequests,
		CategoryBusiness,
		"too many requests, please try again later",
	))
}

// InternalServerError 服务器错误
func InternalServerError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, NewAPIError(
		ErrCodeInternalError,
		CategoryInternal,
		message,
	))
}

// ServiceUnavailableError 服务不可用错误
func ServiceUnavailableError(c *gin.Context, message string) {
	c.JSON(http.StatusServiceUnavailable, NewAPIError(
		ErrCodeServiceUnavailable,
		CategoryExternal,
		message,
	))
}

// BusinessError 业务错误
func BusinessError(c *gin.Context, code ErrorCode, message string) {
	c.JSON(http.StatusBadRequest, NewAPIError(
		code,
		CategoryBusiness,
		message,
	))
}

// ExternalServiceError 外部服务错误
func ExternalServiceError(c *gin.Context, service string, message string) {
	c.JSON(http.StatusBadGateway, NewAPIError(
		ErrCodeBusinessError,
		CategoryExternal,
		fmt.Sprintf("external service error: %s - %s", service, message),
	))
}

// FileTooLargeError 文件过大错误（详细）
func FileTooLargeError(c *gin.Context, actualSize, maxSize string) {
	c.JSON(http.StatusRequestEntityTooLarge, NewAPIError(
		ErrCodeFileTooLarge,
		CategoryValidation,
		fmt.Sprintf("file size %s exceeds maximum limit of %s", actualSize, maxSize),
	))
}

// InvalidFileTypeError 无效文件类型错误
func InvalidFileTypeError(c *gin.Context, fileType string, allowedTypes []string) {
	c.JSON(http.StatusUnsupportedMediaType, NewAPIError(
		ErrCodeInvalidFileType,
		CategoryValidation,
		fmt.Sprintf("file type '%s' is not allowed. allowed types: %v", fileType, allowedTypes),
	))
}

// SuccessWithMessage 带消息的成功响应
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Code:    ErrCodeSuccess,
		Message: message,
		Data:    data,
	})
}

// QuotaExceededError 配额超限错误
func QuotaExceededError(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, NewAPIError(
		ErrCodeQuotaExceeded,
		CategoryBusiness,
		message,
	))
}

// FolderError 文件夹操作错误
func FolderError(c *gin.Context, code ErrorCode, message string) {
	c.JSON(http.StatusBadRequest, NewAPIError(
		code,
		CategoryBusiness,
		message,
	))
}

// BatchLimitError 批量操作超限错误
func BatchLimitError(c *gin.Context, max int) {
	c.JSON(http.StatusBadRequest, NewAPIError(
		ErrCodeBatchLimitExceeded,
		CategoryValidation,
		fmt.Sprintf("batch operation exceeds maximum of %d items", max),
	))
}
