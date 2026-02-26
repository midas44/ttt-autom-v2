  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y", "@playwright/mcp@latest",
        "--browser", "chromium",
        "--codegen", "typescript",
        "--test-id-attribute", "data-qa"
      ]
    },