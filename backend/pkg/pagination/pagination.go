package pagination

import (
	"github.com/gin-gonic/gin"
	"xunjianbao-backend/pkg/response"
)

const (
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100
)

type Params struct {
	Page     int
	PageSize int
	Offset   int
}

func Parse(c *gin.Context) Params {
	page, _ := ParseQueryInt(c, "page", DefaultPage)
	pageSize, _ := ParseQueryInt(c, "page_size", DefaultPageSize)

	if page < 1 {
		page = DefaultPage
	}
	if pageSize < 1 || pageSize > MaxPageSize {
		pageSize = DefaultPageSize
	}

	return Params{
		Page:     page,
		PageSize: pageSize,
		Offset:   (page - 1) * pageSize,
	}
}

type PageResult struct {
	Data     interface{} `json:"data"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

func NewPageResult(data interface{}, total int64, p Params) PageResult {
	return PageResult{
		Data:     data,
		Total:    total,
		Page:     p.Page,
		PageSize: p.PageSize,
	}
}

func ParseQueryInt(c *gin.Context, key string, defaultVal int) (int, error) {
	str := c.DefaultQuery(key, "")
	if str == "" {
		return defaultVal, nil
	}
	val := 0
	for _, ch := range str {
		if ch < '0' || ch > '9' {
			return defaultVal, nil
		}
		val = val*10 + int(ch-'0')
	}
	return val, nil
}

// Response helpers for paginated results
func OK(c *gin.Context, data interface{}) {
	response.Success(c, data)
}

func PageOK(c *gin.Context, data interface{}, total int64, p Params) {
	response.Success(c, NewPageResult(data, total, p))
}
