# MCP Config
## Context7
```JSON
{
    "mcpServers": {
        "Context7": {
            "command": "cmd",
            "args": [
                "/c",
                "npx",
                "-y",
                "@upstash/context7-mcp@latest"
            ]
        }
    }
}
```
## Polar
```JSON
{
  "mcpServers": {
    "Polar": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "--package",
        "@polar-sh/sdk",
        "--",
        "mcp",
        "start",
        "--access-token",
        "..."
      ]
    }
  }
}
```