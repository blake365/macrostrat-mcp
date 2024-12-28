# macrostrat-mcp
Claude MCP server for Macrostrat API

An MCP server implementation for providing access to the [Macrostrat API](https://macrostrat.org/api) within [Claude Desktop](https://claude.ai/download).

## Overview

This Model Context Protocol (MCP) server enables AI assistants and applications to:

- Query comprehensive geologic data and information provided by the Macrostrat API
- Access geologic units, columns, minerals, timescales, and more
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

Installing this might be tricky if you're not familiar with Node.js and the MCP protocol.

1. Install [Node.js](https://nodejs.org/en/download)
2. Clone this repository to a folder on your local machine
3. The server is already built so you can skip the build step.

### Extra Steps

If you want to make changes to the server you can do so by editing the `src/index.ts` file.
- Run `npm install` to install dependencies
- Run `npm run build` to build the server
- Quit and restart Claude Desktop after making changes


## Connecting with Claude Desktop

1. Open your Claude Desktop configuration at:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:
```json
{
    "mcpServers": {
        "macrostrat": {
            "command": "node",
            "args": [
                "/Full/Route/to/Folder/macrostrat/build/index.js"
            ]
        }
    }
}
```

3. Close/Quit then restart Claude Desktop

Once you restart you should see a small hammer icon in the lower right corner of the textbox. If you hover over the icon you'll see the number of MCP tools available.

## Troubleshooting

If you get errors when running the server you may need to provide the full path to the `node` command. For example, on macOS: `/usr/local/bin/node`