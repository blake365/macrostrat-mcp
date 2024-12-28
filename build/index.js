import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, ListRootsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
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
        type: "api",
        uri: "https://macrostrat.org/api/defs",
        name: "Macrostrat Definitions API",
        description: "Endpoint for querying definitions and dictionaries",
    },
    // {
    // 	type: "geographic" as const,
    // 	uri: "geo:///north-america",
    // 	name: "North America",
    // 	bounds: {
    // 		north: 90,
    // 		south: 15,
    // 		east: -50,
    // 		west: -170,
    // 	},
    // },
    // {
    // 	type: "geographic" as const,
    // 	uri: "geo:///united-states",
    // 	name: "United States",
    // 	bounds: {
    // 		north: 49,
    // 		south: 25,
    // 		east: -66,
    // 		west: -125,
    // 	},
    // },
];
server.setRequestHandler(ListRootsRequestSchema, async () => {
    return {
        roots: ROOTS,
    };
});
const PROMPTS = {
    "geologic-history": {
        name: "geologic-history",
        description: "Get the geologic history of a location",
        arguments: [
            {
                name: "location",
                description: "The location to get the geologic history of",
                type: "string",
                required: true,
            },
        ],
    },
    bedrock: {
        name: "bedrock",
        description: "Get information about bedrock geology",
        arguments: [
            {
                name: "location",
                description: "The location to get the bedrock information of",
                type: "string",
                required: true,
            },
        ],
    },
};
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: Object.values(PROMPTS),
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS[request.params.name];
    if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
    }
    if (request.params.name === "geologic-history") {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Generate a comprehensive geologic history for the location: ${request.params.arguments?.location}. Use the Macrostrat API to find columns and units in the area. Use long responses to get detailed information.`,
                    },
                },
            ],
        };
    }
    if (request.params.name === "bedrock") {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Get information about bedrock geology for the location ${request.params.arguments?.location} by using the Macrostrat API to find the upper most unit in the area. Use long responses to get detailed information.`,
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
                name: "find-columns",
                description: "Query Macrostrat stratigraphic columns",
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
                        responseType: {
                            type: "string",
                            description: "The length of response long or short",
                            enum: ["long", "short"],
                            default: "long",
                        },
                    },
                    required: ["lat", "lng", "responseType"],
                },
            },
            {
                name: "find-units",
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
                        responseType: {
                            type: "string",
                            description: "The length of response long or short. Long provides lots of good details",
                            enum: ["long", "short"],
                            default: "long",
                        },
                    },
                    required: ["lat", "lng", "responseType"],
                },
            },
            {
                name: "defs",
                description: "Routes giving access to standard fields and dictionaries used in Macrostrat",
                inputSchema: {
                    type: "object",
                    properties: {
                        endpoint: {
                            type: "string",
                            description: "The endpoint to query",
                            enum: [
                                "lithologies",
                                "structures",
                                "columns",
                                "econs",
                                "minerals",
                                "timescales",
                                "environments",
                                "strat_names",
                                "measurements",
                                "intervals",
                            ],
                        },
                        parameters: {
                            type: "string",
                            description: "parameters to pass to the endpoint",
                        },
                    },
                    required: ["endpoint", "parameters"],
                },
            },
            {
                name: "defs-autocomplete",
                description: "Quickly retrieve all definitions matching a query. Limited to 100 results",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "the search term",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "mineral-info",
                description: "Get information about a mineral, use one property",
                inputSchema: {
                    type: "object",
                    properties: {
                        mineral: {
                            type: "string",
                            description: "The name of the mineral",
                        },
                        mineral_type: {
                            type: "string",
                            description: "The type of mineral",
                        },
                        element: {
                            type: "string",
                            description: "An element that the mineral is made of",
                        },
                    },
                },
            },
            {
                name: "timescale",
                description: "Get information about a time period",
                inputSchema: {
                    type: "object",
                    properties: {
                        age: { type: "number" },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    let data;
    if (request.params.name === "find-columns") {
        const { lat, lng, adjacents, responseType } = request.params
            .arguments;
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            adjacents: adjacents?.toString() ?? "false",
            response: responseType,
        });
        const response = await fetch(`${getApiEndpoint("columns")}?${params}`);
        data = await response.json();
    }
    else if (request.params.name === "find-units") {
        const { lat, lng, responseType } = request.params.arguments;
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            response: responseType,
        });
        const response = await fetch(`${getApiEndpoint("units")}?${params}`);
        data = await response.json();
    }
    else if (request.params.name === "defs") {
        const { endpoint, parameters } = request.params.arguments;
        const params = new URLSearchParams({ endpoint, parameters });
        const response = await fetch(`${getApiEndpoint("base")}/defs/${endpoint}?${params}`);
        data = await response.json();
    }
    else if (request.params.name === "defs-autocomplete") {
        const { query } = request.params.arguments;
        const params = new URLSearchParams({ query });
        const response = await fetch(`${getApiEndpoint("base")}/defs/autocomplete?${params}`);
        data = await response.json();
    }
    else if (request.params.name === "mineral-info") {
        const { mineral, mineral_type, element } = request.params.arguments;
        const params = new URLSearchParams();
        if (mineral)
            params.append("mineral", mineral);
        if (mineral_type)
            params.append("mineral_type", mineral_type);
        if (element)
            params.append("element", element);
        const response = await fetch(`${getApiEndpoint("base")}/defs/minerals?${params}`);
        data = await response.json();
    }
    else if (request.params.name === "timescale") {
        const { age } = request.params.arguments;
        const params = new URLSearchParams({
            timescale_id: "11",
            age: age.toString(),
        });
        const response = await fetch(`${getApiEndpoint("base")}/v2/defs/intervals?${params}`);
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
    // const inRoot = ROOTS.some((root) => {
    // 	if (root.type !== "geographic") return false;
    // 	return (
    // 		lat <= root.bounds.north &&
    // 		lat >= root.bounds.south &&
    // 		lng >= root.bounds.west &&
    // 		lng <= root.bounds.east
    // 	);
    // });
    // if (!inRoot) {
    // 	throw new Error(
    // 		"Coordinates outside supported regions. The Macrostrat API primarily covers North America.",
    // 	);
    // }
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
async function getUnits(lat, lng, responseType, age) {
    validateCoordinates(lat, lng);
    const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        response: responseType,
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
async function getColumns(lat, lng, responseType, adjacents) {
    const params = {
        lat: lat.toString(),
        lng: lng.toString(),
        adjacents: adjacents ? "true" : "false",
        response: responseType,
    };
    const resp = await fetch(`${getApiEndpoint("columns")}?${new URLSearchParams(params)}`);
    if (!resp.ok) {
        throw new Error(`Failed to get columns: ${resp.status} ${resp.statusText}`);
    }
    const data = (await resp.json());
    const sendData = data?.success?.data;
    return sendData;
}
// function summarizeUnits(units: MacrostratUnit[]) {
// 	if (units.length === 0) return "No units found";
// 	const summaries = units.map((u) => {
// 		const age =
// 			u.t_int_age && u.b_int_age
// 				? `${u.t_int_age} to ${u.b_int_age} Ma (${u.t_int_name} to ${u.b_int_name})`
// 				: "Age unknown";
// 		return `${u.strat_name || u.name || "Unnamed unit"}:
// 		• Map ID: ${u.map_id || "Not specified"}
// 		• Source ID: ${u.source_id || "Not specified"}
// 		• Age: ${age}
// 		• Lithology: ${u.lith || "Not specified"}
// 		• Description: ${u.descrip || "No description available"}
// 		${u.comments ? `• Comments: ${u.comments}` : ""}
// 		${u.macro_units ? `• Associated Macrostrat Units: ${u.macro_units.join(", ")}` : ""}
// 		${u.strat_names ? `• Associated Strat Names: ${u.strat_names.join(", ")}` : ""}
// 		${u.color ? `• Map Color: ${u.color}` : ""}`;
// 	});
// 	// Add summary statistics
// 	const ageRange = units
// 		.filter((u) => u.t_int_age && u.b_int_age)
// 		.reduce(
// 			(range, u) => {
// 				return {
// 					min: Math.min(range.min, u.b_int_age!),
// 					max: Math.max(range.max, u.t_int_age!),
// 				};
// 			},
// 			{ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
// 		);
// 	const summary = `Found ${units.length} units${ageRange.min !== Number.POSITIVE_INFINITY ? ` spanning ${ageRange.min} to ${ageRange.max} Ma` : ""}
// Detailed unit descriptions:
// ${summaries.join("\n\n")}`;
// 	return summary;
// }
// function summarizeColumns(columns: any[]) {
// 	if (columns.length === 0) return "No columns found";
// 	const names = columns.map((c) => c.col_name).join(", ");
// 	const ages = columns.map((c) => Number(c.col_t_age));
// 	const ageRange = `spanning ${Math.min(...ages)} to ${Math.max(...ages)}`;
// 	return `${columns.length} columns including ${names}, ${ageRange}`;
// }
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});
