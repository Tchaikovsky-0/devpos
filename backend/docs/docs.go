package docs

const docTemplate = `{
    "openapi": "3.0.3",
    "info": {
        "title": "{{.Title}}",
        "description": "{{.Description}}",
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}"
}`

// Spec holds the generated Swagger metadata used by the docs package.
type Spec struct {
	Version          string
	Host             string
	BasePath         string
	Title            string
	Description      string
	InfoInstanceName string
	SwaggerTemplate  string
}

func (s *Spec) InstanceName() string {
	if s.InfoInstanceName == "" {
		return "swagger"
	}
	return s.InfoInstanceName
}

// SwaggerInfo holds exported Swagger Info so clients can modify it.
var SwaggerInfo = &Spec{
	Version:          "1.0.0",
	Host:             "localhost:8094",
	BasePath:         "/",
	Title:            "巡检宝 API",
	Description:      "面向重工业企业的智能监控平台 API",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}
