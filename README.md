[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/blake365-macrostrat-mcp-badge.png)](https://mseep.ai/app/blake365-macrostrat-mcp)

# macrostrat-mcp
MCP server for Macrostrat API

[![npm version](https://img.shields.io/npm/v/macrostrat-mcp.svg)](https://www.npmjs.com/package/macrostrat-mcp)

<a href="https://glama.ai/mcp/servers/v67anfiq0s">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/v67anfiq0s/badge" alt="Macrostrat Server MCP server" />
</a>

An MCP server providing access to the [Macrostrat API](https://macrostrat.org/api) from
[Claude Desktop](https://claude.ai/download), Claude Code, and any other MCP client.

```bash
npx -y macrostrat-mcp
```

No API key required — the Macrostrat API is free and public.

## Overview

This Model Context Protocol (MCP) server enables AI assistants and applications to:

- Query comprehensive geologic data and information provided by the Macrostrat API
- Access geologic units, columns, minerals, timescales, and more
- Get geologic map tiles that the LLM can interpret (questionable utility, but might be useful for some applications)
- Analyze geologic data to improve geological understanding
- Create graphics and perform data analysis from the data

Users can run queries using natural language.

## Sample Output

**Q. What is the geologic history of Nashville, TN?**

A. 
Let me check the geological data for Nashville's location.

View Result from find-units from macrostrat (local)
```json
{
  "lat": 36.1627,
  "lng": -86.7816,
  "responseType": "long"
}
```

### Geological History of Nashville, Tennessee
1. Mesoproterozoic Basement (1.6-1.1 billion years ago)
- Igneous basement rocks (granite and rhyolite)
- Part of the ancient North American craton

2. Early-Middle Cambrian (518-504 million years ago)
- Rome Formation: Mixed carbonate-siliciclastic sediments
- Shallow marine environment
- Part of the developing continental shelf

3. Middle-Late Cambrian (504-498 million years ago)
- Conasauga Formation: Limestone and mixed sediments
- Continued marine deposition
- Alternating limestone and shale indicating fluctuating sea levels

4. Late Cambrian-Early Ordovician (498-470 million years ago)
- Knox Dolomite: Massive dolomite sequence
- Extensive shallow marine platform
- Up to 1,200 meters thick
- Represents long period of stable marine conditions

5. Middle-Late Ordovician (470-443 million years ago)
Several important formations:
- Stones River Group (including Murfreesboro, Pierce, Lebanon Limestones)
- Nashville Group (including Hermitage, Bigby-Cannon, Catheys Formations)
- Primarily limestone deposits
- Rich in fossils
- Shallow marine environment
- Multiple cycles of sea level change

6. Early-Middle Silurian (443-423 million years ago)
- Brassfield through Decatur Formations
- Continued marine limestone deposition
- Various marine environments from shallow to deeper water

7. Middle Devonian-Early Mississippian (390-357 million years ago)
- Pegram Formation through Chattanooga Shale
- Shift to more clastic (shale) deposition
- Chattanooga Shale represents deeper, oxygen-poor conditions

8. Early-Late Mississippian (357-331 million years ago)
Several limestone formations:
- Fort Payne Formation
- Warsaw Limestone
- St. Louis Limestone
- Monteagle Limestone
- Hartselle Formation
- Return to carbonate platform conditions
- Diverse marine environments

9. Cenozoic to Present
- Long period of erosion and exposure
- Development of the current landscape
- Formation of the Nashville Dome structure
- River and stream deposits

### Key Features
- The area was predominantly a marine environment for most of its geological history
- Dominated by limestone formations indicating warm, shallow seas
- Multiple cycles of sea level change
- Rich fossil record, especially in Ordovician rocks
- Part of the Nashville Dome structural feature
- Long periods of erosion have removed younger rocks
- Current topography shaped by differential erosion of various limestone units

### Present Day Bedrock
The bedrock of Nashville today consists primarily of Ordovician limestone formations exposed at the surface, particularly the Stones River and Nashville Group limestones. These rocks are well exposed in many areas and have influenced the development of local karst topography, including caves and sinkholes that are common in the region.

## Installation

Requires Node.js 20 or newer. No install step is needed — `npx` fetches the server on
first run.

### Claude Desktop

1. Open your Claude Desktop configuration at:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:
```json
{
    "mcpServers": {
        "macrostrat": {
            "command": "npx",
            "args": ["-y", "macrostrat-mcp"]
        }
    }
}
```

3. Close/Quit then restart Claude Desktop

Once you restart you should see an icon for search and tools. Click this button to see the MCP tools available.

### Claude Code

```bash
claude mcp add macrostrat -- npx -y macrostrat-mcp
```

### Any other MCP client

The server speaks MCP over STDIO. Run it with `npx -y macrostrat-mcp`, or install it
globally with `npm install -g macrostrat-mcp` and run `macrostrat-mcp`.

## Development

```bash
npm install        # install dependencies
npm run dev        # run from source over STDIO, no build step
npm run build      # compile TypeScript to build/
npm run typecheck  # type-check without emitting
```

`src/server.ts` holds all the tools, prompts, and API calls — that is the file to edit.
`src/index.ts` is just the STDIO entry point.

To point Claude Desktop at a local build instead of the published package, use
`"command": "node"` with `"args": ["/full/path/to/macrostrat/build/index.js"]`, and
restart Claude Desktop after each rebuild.

### Using it as a library

The server factory is exported if you want to attach a different transport:

```js
import createServer from "macrostrat-mcp";

const server = createServer();
await server.connect(yourTransport);
```

## Troubleshooting

If Claude Desktop cannot find `npx`, provide its full path (on macOS, typically
`/usr/local/bin/npx` or `/opt/homebrew/bin/npx`). The same applies to `node` if you are
running a local build.