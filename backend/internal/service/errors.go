package service

import (
	"errors"
	"os"
	"strconv"
)

var (
	ErrNotFound           = errors.New("resource not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountDisabled    = errors.New("account is disabled")
	ErrUserExists         = errors.New("user already exists")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrBadRequest         = errors.New("bad request")

	// Media-specific errors
	ErrFileTooLarge       = errors.New("file size exceeds maximum limit")
	ErrInvalidFileType    = errors.New("file type not allowed")
	ErrQuotaExceeded      = errors.New("storage quota exceeded")
	ErrFolderCycle        = errors.New("cannot move folder into its own subtree")
	ErrFolderDepth        = errors.New("folder nesting depth exceeds limit")
	ErrFolderDuplicate    = errors.New("folder name already exists in this location")
	ErrFolderNotEmpty     = errors.New("folder is not empty")
	ErrBatchLimitExceeded = errors.New("batch operation exceeds maximum item count")
)

// ParseUint parses a string to uint
func ParseUint(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(v), nil
}

// getEnvInt reads an integer from environment variable with a default fallback.
func getEnvInt(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}

// getEnvInt64 reads an int64 from environment variable with a default fallback.
func getEnvInt64(key string, defaultVal int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return defaultVal
}
