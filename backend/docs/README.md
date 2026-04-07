# Swagger API Documentation

This directory contains the auto-generated Swagger documentation for the Xunjianbao API.

## Generating Documentation

To generate or update the Swagger documentation, run:

```bash
make swagger
```

Or manually:

```bash
swag init -g cmd/server/main.go -o docs
```

## Accessing Documentation

Once the server is running, you can access the Swagger UI at:

```
http://localhost:8094/swagger/index.html
```

## Adding API Documentation

Add Swagger annotations to your handlers. Example:

```go
// @Summary List all streams
// @Description Get a paginated list of streams for the authenticated tenant
// @Tags streams
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Items per page" default(20)
// @Success 200 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /streams [get]
func (h *StreamHandler) List(c *gin.Context) {
    // Implementation
}
```
