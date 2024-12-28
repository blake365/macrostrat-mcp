import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
const API_BASE = "https://macrostrat.org/api";
const server = new Server({ name: "macrostrat", version: "1.0.0" }, { capabilities: { tools: {}, prompts: {} } });
const PROMPTS = [
    {
        name: "location_units",
        description: "Get geologic units at a location",
        arguments: [
            { name: "lat", description: "Latitude of the location", required: true },
            { name: "lng", description: "Longitude of the location", required: true },
        ],
    },
    {
        name: "location_cols",
        description: "Get stratigraphic columns near a location",
        arguments: [
            { name: "lat", description: "Latitude of the location", required: true },
            { name: "lng", description: "Longitude of the location", required: true },
            {
                name: "radius",
                description: "Search radius in meters (default 100000)",
                required: false,
            },
        ],
    },
    {
        name: "location_summary",
        description: "Summarize the geologic history of a location",
        arguments: [
            { name: "lat", description: "Latitude of the location", required: true },
            { name: "lng", description: "Longitude of the location", required: true },
        ],
    },
];
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS.find((p) => p.name === request.params.name);
    if (!prompt)
        throw new Error(`Unknown prompt: ${request.params.name}`);
    const { lat, lng, radius = 100000 } = request.params.arguments;
    try {
        if (prompt.name === "location_units") {
            const units = await getUnits(+lat, +lng);
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Geologic units at ${lat}, ${lng}:\n\n${JSON.stringify(units, null, 2)}`,
                        },
                    },
                ],
            };
        }
        else if (prompt.name === "location_cols") {
            const cols = await getColumns(+lat, +lng, +radius);
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Stratigraphic columns within ${radius}m of ${lat}, ${lng}:\n\n${JSON.stringify(cols, null, 2)}`,
                        },
                    },
                ],
            };
        }
        else if (prompt.name === "location_summary") {
            const [units, cols] = await Promise.all([
                getUnits(+lat, +lng),
                getColumns(+lat, +lng),
            ]);
            console.log(units, cols);
            const unitSummary = summarizeUnits(units);
            const colSummary = summarizeColumns(cols);
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Summarize the geologic history at ${lat}, ${lng}`,
                        },
                    },
                    {
                        role: "assistant",
                        content: {
                            type: "text",
                            text: `Key geologic units:\n${unitSummary}\n\nNearby stratigraphic columns suggest:\n${colSummary}`,
                        },
                    },
                ],
            };
        }
    }
    catch (err) {
        console.error(`Error in prompt ${prompt.name}:`, err);
        return {
            messages: [
                {
                    role: "assistant",
                    content: {
                        type: "text",
                        text: "Sorry, an error occurred while fetching data for the given location. Please try again later.",
                    },
                },
            ],
        };
    }
    return {};
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "columns",
                description: "Search and summarize stratigraphic columns",
                inputSchema: {
                    type: "object",
                    properties: {
                        params: { type: "object", additionalProperties: true },
                    },
                },
            },
            {
                name: "units",
                description: "Query Macrostrat geologic units",
                inputSchema: {
                    type: "object",
                    properties: {
                        params: { type: "object", additionalProperties: true },
                    },
                },
            },
            {
                name: "defs",
                description: "Get Macrostrat definitions and dictionaries",
                inputSchema: {
                    type: "object",
                    properties: {
                        endpoint: { type: "string" },
                    },
                    required: ["endpoint"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { params = {} } = request.params.arguments;
    let data;
    if (request.params.name === "columns") {
        const response = await fetch(`${API_BASE}/columns?${new URLSearchParams(params)}`);
        data = await response.json();
    }
    else if (request.params.name === "units") {
        const response = await fetch(`${API_BASE}/units?${new URLSearchParams(params)}`);
        data = await response.json();
    }
    else if (request.params.name === "defs") {
        const { endpoint } = request.params.arguments;
        const response = await fetch(`${API_BASE}/defs/${endpoint}`);
        data = await response.json();
    }
    else {
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    return {
        content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
        ],
    };
});
async function getUnits(lat, lng) {
    const params = { lat: lat.toString(), lng: lng.toString() };
    const resp = await fetch(`${API_BASE}/units?${new URLSearchParams(params)}`);
    if (!resp.ok) {
        throw new Error(`Failed to get units: ${resp.status} ${resp.statusText}`);
    }
    return (await resp.json());
}
async function getColumns(lat, lng, radius = 100000) {
    const params = {
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
    };
    const resp = await fetch(`${API_BASE}/columns?${new URLSearchParams(params)}`);
    if (!resp.ok) {
        throw new Error(`Failed to get columns: ${resp.status} ${resp.statusText}`);
    }
    return (await resp.json());
}
function summarizeUnits(units) {
    console.log(units);
    const names = units.map((u) => u.strat_name).join(", ");
    const ages = units.map((u) => Number(u.t_age));
    const ageRange = `from ${Math.min(...ages)} to ${Math.max(...ages)}`;
    return `${names} aged ${ageRange}`;
}
function summarizeColumns(columns) {
    if (columns.length === 0)
        return "No columns found";
    const names = columns.map((c) => c.col_name).join(", ");
    const ages = columns.map((c) => Number(c.col_t_age));
    const ageRange = `spanning ${Math.min(...ages)} to ${Math.max(...ages)}`;
    return `${columns.length} columns including ${names}, ${ageRange}`;
}
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});
