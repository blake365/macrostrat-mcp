# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides access to the Macrostrat geological API. It enables AI assistants to query comprehensive geological data including geologic units, columns, minerals, and timescales.

## Architecture

**Core Components:**
- `src/index.ts`: Main MCP server implementation using `@modelcontextprotocol/sdk`
- Single-file architecture with all tools, prompts, and API integrations in one module
- Built as a CLI tool that outputs to `build/index.js` with executable permissions

**Key Features:**
- 6 main tools for querying Macrostrat API endpoints
- 2 built-in prompts for common geological queries
- Resource schemas for API response validation
- Coordinate validation for geographic queries

## Development Commands

```bash
# Install dependencies
npm install

# Build the server (compiles TypeScript and sets executable permissions)
npm run build

# No tests configured (test command will fail)
npm test  # Returns error
```

## API Integration

The server connects to multiple Macrostrat API endpoints:
- `https://macrostrat.org/api/units` - Geologic units
- `https://macrostrat.org/api/columns` - Stratigraphic columns  
- `https://macrostrat.org/api/geologic_units/map` - Map units
- `https://macrostrat.org/api/defs/*` - Definitions and dictionaries

**Tools Available:**
- `find-columns`: Query stratigraphic columns by lat/lng
- `find-units`: Query geologic units by lat/lng
- `defs`: Access definitions (lithologies, minerals, timescales, etc.)
- `defs-autocomplete`: Quick definition search (100 result limit)
- `mineral-info`: Get mineral details by name/type/element
- `timescale`: Get time period information by age

## MCP Configuration

After building, configure Claude Desktop with:
```json
{
  "mcpServers": {
    "macrostrat": {
      "command": "node",
      "args": ["/full/path/to/macrostrat/build/index.js"]
    }
  }
}
```

## TypeScript Configuration

- Target: ES2022 with Node16 modules
- Outputs to `./build` directory
- Strict mode enabled
- Source in `./src` directory only