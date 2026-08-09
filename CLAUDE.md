# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides access to the Macrostrat geological API. It enables AI assistants to query comprehensive geological data including geologic units, columns, minerals, and timescales.

## Architecture

**Core Components:**
- `src/server.ts`: Server factory (`createServer`) with all tools, prompts, resource
  schemas, and API integrations. Side-effect free — it only builds and returns a server.
- `src/index.ts`: STDIO entry point. Imports `createServer` and connects a
  `StdioServerTransport`. This is what `build/index.js` becomes, and what Claude
  Desktop runs.

The two entry points are deliberately separate: the Smithery HTTP runtime bundles
`src/server.ts` (via the `module` field in package.json), so neither file has to
detect whether it is the process entry point.

**Key Features:**
- 8 tools for querying Macrostrat API endpoints
- 3 built-in prompts for common geological queries
- Resource schemas for API response validation
- Coordinate validation for geographic queries
- All tools are annotated `readOnlyHint: true`; everything except `lat-lng-to-tile`
  is also `openWorldHint: true`

**Conventions:**
- Use the shared `fetchJson()` helper for Macrostrat JSON endpoints. It applies the
  30s timeout and converts non-2xx responses and network failures into tool errors
  (`isError: true`) rather than throwing.
- Native `fetch` is used — do not reintroduce `node-fetch`.

## Development Commands

```bash
# Install dependencies
npm install

# Build the STDIO server for Claude Desktop
# (compiles TypeScript to build/ and sets executable permissions)
npm run build:stdio

# Build the Smithery HTTP bundle for hosted deploys -> .smithery/shttp/
npm run build

# Run from source over STDIO, no build step
npm run dev:stdio

# No tests configured (test command will fail)
npm test  # Returns error
```

Note: `@smithery/cli` is pinned to the v3 line. v4 dropped the `build`, `dev`, and
`publish` commands and is now a consumer-only CLI, so it cannot build this server.

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
- `lat-lng-to-tile`: Convert lat/lng + zoom to web mercator tile x/y (local, no network)
- `map-tiles`: Get Macrostrat map tile URLs, optionally fetching the PNG for analysis

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