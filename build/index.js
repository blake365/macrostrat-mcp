import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, ListRootsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
const API_BASE = "https://macrostrat.org/api";
const server = new Server({ name: "macrostrat", version: "1.0.0" }, {
    capabilities: {
        tools: {},
        prompts: {},
        roots: {},
    },
});
const ROOTS = [
    {
        type: "api",
        uri: "https://macrostrat.org/api",
        name: "Macrostrat API",
        description: "Main Macrostrat API endpoint",
    },
    {
        type: "api",
        uri: "https://macrostrat.org/api/geologic_units/map",
        name: "Macrostrat Map Units API",
        description: "Endpoint for querying geologic map units",
    },
    {
        type: "api",
        uri: "https://macrostrat.org/api/units",
        name: "Macrostrat Units API",
        description: "Endpoint for querying geologic units",
    },
    {
        type: "api",
        uri: "https://macrostrat.org/api/columns",
        name: "Macrostrat Columns API",
        description: "Endpoint for querying stratigraphic columns",
    },
    {
        type: "geographic",
        uri: "geo:///north-america",
        name: "North America",
        bounds: {
            north: 90,
            south: 15,
            east: -50,
            west: -170,
        },
    },
    {
        type: "geographic",
        uri: "geo:///united-states",
        name: "United States",
        bounds: {
            north: 49,
            south: 25,
            east: -66,
            west: -125,
        },
    },
];
server.setRequestHandler(ListRootsRequestSchema, async () => {
    return {
        roots: ROOTS,
    };
});
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
                name: "adjacents",
                description: "Include adjacent columns",
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
    {
        name: "time_period_units",
        description: "Get geologic units from a specific time period",
        arguments: [
            {
                name: "age",
                description: "Age in millions of years",
                required: true,
            },
            { name: "lat", description: "Latitude of the location", required: true },
            { name: "lng", description: "Longitude of the location", required: true },
            {
                name: "adjacent",
                description: "Include adjacent units",
                required: false,
            },
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
    const { lat, lng, adjacents = true, age } = request.params.arguments;
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
        if (prompt.name === "location_cols") {
            const cols = await getColumns(+lat, +lng, adjacents);
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Stratigraphic columns at ${lat}, ${lng}:\n\n${JSON.stringify(cols, null, 2)}`,
                        },
                    },
                ],
            };
        }
        if (prompt.name === "location_summary") {
            const [units, cols] = await Promise.all([
                getUnits(+lat, +lng),
                getColumns(+lat, +lng, adjacents),
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
        if (prompt.name === "time_period_units") {
            const units = await getUnits(+lat, +lng, age);
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Geologic units at ${lat}, ${lng} from ${age} Million years ago:\n\n${JSON.stringify(units, null, 2)}`,
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
                        lat: {
                            type: "number",
                            description: "A valid latitude in decimal degrees",
                        },
                        lng: {
                            type: "number",
                            description: "A valid longitude in decimal degrees",
                        },
                        adjacents: {
                            type: "boolean",
                            description: "Include adjacent columns",
                        },
                    },
                    required: ["lat", "lng"],
                },
            },
            {
                name: "units",
                description: "Query Macrostrat geologic units",
                inputSchema: {
                    type: "object",
                    properties: {
                        lat: {
                            type: "number",
                            description: "A valid latitude in decimal degrees",
                        },
                        lng: {
                            type: "number",
                            description: "A valid longitude in decimal degrees",
                        },
                    },
                    required: ["lat", "lng"],
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
    let data;
    if (request.params.name === "columns") {
        const { lat, lng, adjacents } = request.params.arguments;
        const response = await fetch(`${getApiEndpoint("columns")}?${new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            adjacents: adjacents,
        })}`);
        data = await response.json();
    }
    else if (request.params.name === "units") {
        const { lat, lng } = request.params.arguments;
        const response = await fetch(`${getApiEndpoint("mapUnits")}?${new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
        })}`);
        data = await response.json();
    }
    else if (request.params.name === "defs") {
        const { endpoint } = request.params.arguments;
        const response = await fetch(`${getApiEndpoint("base")}/defs/${endpoint}`);
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
function validateCoordinates(lat, lng) {
    if (typeof lat !== "number" || typeof lng !== "number") {
        throw new Error("Coordinates must be numbers");
    }
    if (lat < -90 || lat > 90) {
        throw new Error("Latitude must be between -90 and 90 degrees");
    }
    if (lng < -180 || lng > 180) {
        throw new Error("Longitude must be between -180 and 180 degrees");
    }
    const inRoot = ROOTS.some((root) => {
        if (root.type !== "geographic")
            return false;
        return (lat <= root.bounds.north &&
            lat >= root.bounds.south &&
            lng >= root.bounds.west &&
            lng <= root.bounds.east);
    });
    if (!inRoot) {
        throw new Error("Coordinates outside supported regions. The Macrostrat API primarily covers North America.");
    }
}
function getApiEndpoint(type) {
    const endpoint = ROOTS.find((root) => {
        if (root.type !== "api")
            return false;
        switch (type) {
            case "mapUnits":
                return root.uri === "https://macrostrat.org/api/geologic_units/map";
            case "units":
                return root.uri === "https://macrostrat.org/api/units";
            case "columns":
                return root.uri === "https://macrostrat.org/api/columns";
            case "base":
                return root.uri === "https://macrostrat.org/api";
            default:
                return false;
        }
    });
    if (!endpoint) {
        throw new Error(`API endpoint not found for type: ${type}`);
    }
    return endpoint.uri;
}
async function getUnits(lat, lng, age) {
    validateCoordinates(lat, lng);
    const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
    });
    if (age) {
        params.set("age", age.toString());
        const resp = await fetch(`${getApiEndpoint("units")}?${params}`);
        if (!resp.ok) {
            throw new Error(`Failed to get units: ${resp.status} ${resp.statusText}`);
        }
        const data = (await resp.json());
        return data;
    }
    const resp = await fetch(`${getApiEndpoint("mapUnits")}?${params}`);
    if (!resp.ok) {
        throw new Error(`Failed to get map units: ${resp.status} ${resp.statusText}`);
    }
    const data = (await resp.json());
    const references = data.success.refs;
    let sendData = data.success.data;
    // Merge references with their corresponding data
    sendData = sendData.map((unit) => ({
        ...unit,
        references: references[unit.source_id] || null,
    }));
    return sendData;
}
async function getColumns(lat, lng, adjacents = false) {
    const params = {
        lat: lat.toString(),
        lng: lng.toString(),
        adjacents: adjacents ? "true" : "false",
    };
    const resp = await fetch(`${getApiEndpoint("columns")}?${new URLSearchParams(params)}`);
    if (!resp.ok) {
        throw new Error(`Failed to get columns: ${resp.status} ${resp.statusText}`);
    }
    const data = (await resp.json());
    const sendData = data?.success?.data;
    return sendData;
}
function summarizeUnits(units) {
    if (units.length === 0)
        return "No units found";
    const summaries = units.map((u) => {
        const age = u.t_int_age && u.b_int_age
            ? `${u.t_int_age} to ${u.b_int_age} Ma (${u.t_int_name} to ${u.b_int_name})`
            : "Age unknown";
        return `${u.strat_name || u.name || "Unnamed unit"}:
		• Map ID: ${u.map_id || "Not specified"}
		• Source ID: ${u.source_id || "Not specified"}
		• Age: ${age}
		• Lithology: ${u.lith || "Not specified"}
		• Description: ${u.descrip || "No description available"}
		${u.comments ? `• Comments: ${u.comments}` : ""}
		${u.macro_units ? `• Associated Macrostrat Units: ${u.macro_units.join(", ")}` : ""}
		${u.strat_names ? `• Associated Strat Names: ${u.strat_names.join(", ")}` : ""}
		${u.color ? `• Map Color: ${u.color}` : ""}`;
    });
    // Add summary statistics
    const ageRange = units
        .filter((u) => u.t_int_age && u.b_int_age)
        .reduce((range, u) => {
        return {
            min: Math.min(range.min, u.b_int_age),
            max: Math.max(range.max, u.t_int_age),
        };
    }, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY });
    const summary = `Found ${units.length} units${ageRange.min !== Number.POSITIVE_INFINITY ? ` spanning ${ageRange.min} to ${ageRange.max} Ma` : ""}

Detailed unit descriptions:
${summaries.join("\n\n")}`;
    return summary;
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
