#!/usr/bin/env python3
"""Fix router - move health outside protected group."""

with open("/opt/xunjianbao/backend/internal/router/router.go", "r") as f:
    content = f.read()

# Move openclaw health outside protected group - add it right after the openclaw group
old_openclaw = '''			openclaw := protected.Group("/openclaw")
			{
				openclaw.GET("/health", openclawHandler.Health)
				openclaw.GET("/missions", openclawHandler.ListMissions)'''

new_openclaw = '''			// OpenClaw public routes
			openclawPublic := v1.Group("/openclaw")
			{
				openclawPublic.GET("/health", openclawHandler.Health)
			}

			openclaw := protected.Group("/openclaw")
			{
				openclaw.GET("/missions", openclawHandler.ListMissions)'''

content = content.replace(old_openclaw, new_openclaw)

with open("/opt/xunjianbao/backend/internal/router/router.go", "w") as f:
    f.write(content)
print("Router updated")
