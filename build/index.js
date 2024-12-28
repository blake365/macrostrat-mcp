import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, ListRootsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
const server = new Server({ name: "macrostrat", version: "1.0.0" }, {
    capabilities: {
        tools: {},
        prompts: {},
        roots: {},
        resources: {},
    },
});
const API_SCHEMAS = {
    units: {
        type: "object",
        properties: {
            unit_id: { type: "integer", description: "unique identifier for unit" },
            section_id: {
                type: "integer",
                description: "unique identifier for section (package)",
            },
            col_id: { type: "integer", description: "unique identifier for column" },
            project_id: {
                type: "integer",
                description: "unique identifier for project, corresponds to general geographic region",
            },
            col_area: {
                type: "number",
                description: "area in square kilometers of the Macrostrat column",
            },
            unit_name: { type: "string", description: "the name of the unit" },
            strat_name_id: {
                type: "integer",
                description: "unique identifier for known stratigraphic name(s) (see /defs/strat_names)",
            },
            Mbr: { type: "string", description: "lithostratigraphic member" },
            Fm: { type: "string", description: "lithostratigraphic formation" },
            Gp: { type: "string", description: "lithostratigraphic group" },
            SGp: { type: "string", description: "lithostratigraphic supergroup" },
            t_age: {
                type: "number",
                description: "continuous time age model estimated for truncation, in Myr before present",
            },
            b_age: {
                type: "number",
                description: "continuous time age model estimated for initiation, in Myr before present",
            },
            max_thick: {
                type: "number",
                description: "maximum unit thickness in meters",
            },
            min_thick: {
                type: "number",
                description: "minimum unit thickness in meters (NB: some zero values may be equivalent in meaning to NULL)",
            },
            outcrop: {
                type: "string",
                description: "describes where unit is exposed or not, values are  'outcrop', 'subsurface', or 'both'",
            },
            pbdb_collections: {
                type: "integer",
                description: "count of PBDB collections in units/column",
            },
            pbdb_occurrences: {
                type: "integer",
                description: "count of PBDB occurrences in units/column",
            },
            lith: {
                type: "string",
                description: "specific lithology, see /defs/lithologies",
            },
            environ: {
                type: "string",
                description: "specific environment, see /defs/environments",
            },
            econ: {
                type: "string",
                description: "name of economic use, see defs/econs",
            },
            measure: {
                type: "array",
                description: "summary of types of measurements available",
            },
            notes: {
                type: "string",
                description: "notes relevant to containing element",
            },
            color: {
                type: "string",
                description: "recommended coloring for units based on dominant lithology",
            },
            text_color: {
                type: "string",
                description: "recommended coloring for text based on color",
            },
            t_int_id: {
                type: "integer",
                description: "the ID of the chronostratigraphic interval containing the top boundary of the unit",
            },
            t_int_name: {
                type: "string",
                description: "the name of the chronostratigraphic interval containing the top boundary of the unit",
            },
            t_int_age: {
                type: "number",
                description: "the top age of the chronostratigraphic interval containing the top boundary of the unit",
            },
            t_prop: {
                type: "number",
                description: "position of continuous time age model top boundary, proportional to reference time interval (t_interval)",
            },
            units_above: {
                type: "array",
                items: { type: "integer" },
                description: "the unit_ids of the units contacting the top of the unit",
            },
            b_int_id: {
                type: "integer",
                description: "the ID of the chronostratigraphic interval containing the bottom boundary of the unit",
            },
            b_int_name: {
                type: "string",
                description: "the name of the chronostratigraphic interval containing the bottom boundary of the unit",
            },
            b_int_age: {
                type: "number",
                description: "the bottom age of the chronostratigraphic interval containing the bottom boundary of the unit",
            },
            b_prop: {
                type: "number",
                description: "position of continuous time age model bottom boundary, proportional to reference time interval (b_interval)",
            },
            units_below: {
                type: "array",
                items: { type: "integer" },
                description: "the unit_ids of the units contacting the bottom of the unit",
            },
            clat: {
                type: "number",
                description: "present day latitude of the centroid of the column to which the unit belongs",
            },
            clng: {
                type: "number",
                description: "present day longitude of the centroid of the column to which the unit belongs",
            },
            t_plat: {
                type: "number",
                description: "same as clat, but rotated to the t_age. Top age paleo latitude.",
            },
            t_plng: {
                type: "number",
                description: "same as clng, but rotated to the t_age. Top age paleo longitude.",
            },
            b_plat: {
                type: "number",
                description: "same as clat, but rotated to the b_age. Bottom age paleo latitude.",
            },
            b_plng: {
                type: "number",
                description: "same as clng, but rotated to the b_age. Bottom age paleo longitude.",
            },
            t_pos: {
                type: "number",
                description: "The position of unit top in ordering of units in section, optionally in units of m for some columns (e.g., eODP project)",
            },
            b_pos: {
                type: "number",
                description: "The position of unit bottom in ordering of units in section, optionally in units of m for some columns (e.g., eODP project)",
            },
        },
    },
    columns: {
        type: "object",
        properties: {
            col_id: { type: "integer", description: "unique identifier for column" },
            col_name: { type: "string", description: "name of column" },
            lat: { type: "number", description: "latitude in WGS84" },
            lng: { type: "number", description: "longitude in WGS84" },
            col_group: {
                type: "string",
                description: "name of group the column belongs to, generally corresponds to geologic provinces",
            },
            col_group_id: {
                type: "integer",
                description: "the ID of the group to which the column belongs",
            },
            group_col_id: {
                type: "number",
                description: "the original column ID assigned to the column (used in the original source)",
            },
            col_area: {
                type: "number",
                description: "area in square kilometers of the Macrostrat column",
            },
            project_id: {
                type: "integer",
                description: "unique identifier for project, corresponds to general geographic region",
            },
            max_thick: {
                type: "number",
                description: "maximum unit thickness in meters",
            },
            max_min_thick: {
                type: "integer",
                description: "the maximum possible minimum thickness in meters",
            },
            min_min_thick: {
                type: "integer",
                description: "the minimum possible minimum thickness in meters",
            },
            b_age: {
                type: "number",
                description: "continuous time age model estimated for initiation, in Myr before present",
            },
            t_age: {
                type: "number",
                description: "continuous time age model estimated for truncation, in Myr before present",
            },
            pbdb_collections: {
                type: "integer",
                description: "count of PBDB collections in units/column",
            },
            lith: {
                type: "string",
                description: "specific lithology, see /defs/lithologies",
            },
            environ: {
                type: "string",
                description: "specific environment, see /defs/environments",
            },
            econ: {
                type: "string",
                description: "name of economic use, see defs/econs",
            },
            t_units: { type: "integer", description: "total units" },
            t_sections: { type: "integer", description: "total sections" },
        },
    },
    minerals: {
        type: "object",
        properties: {
            mineral_id: {
                type: "integer",
                description: "unique identifier for mineral",
            },
            mineral: { type: "string", description: "name of mineral" },
            mineral_type: { type: "string", description: "name of mineral group" },
            hardness_min: {
                type: "number",
                description: "minimum value for Moh's hardness scale",
            },
            hardness_max: {
                type: "number",
                description: "maximum value for Moh's hardness scale",
            },
            mineral_color: {
                type: "string",
                description: "color description of mineral",
            },
            lustre: { type: "string", description: "description of mineral lustre" },
            crystal_form: { type: "string", description: "crystal form of mineral" },
            formula: { type: "string", description: "chemical formula of mineral" },
            formula_tags: {
                type: "string",
                description: "chemical formula of mineral with sub/superscript tags",
            },
            url: {
                type: "string",
                description: "URL where additional information, the source or contributing publication can be found",
            },
        },
    },
};
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [
        {
            uri: "units",
            name: "Units Response Schema",
            description: "JSON schema for the response from the units endpoint",
        },
        {
            uri: "columns",
            name: "Columns Response Schema",
            description: "JSON schema for the response from the columns endpoint",
        },
        {
            uri: "minerals",
            name: "Minerals Response Schema",
            description: "JSON schema for the response from the defs/minerals endpoint",
        },
    ];
    return { resources };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const schema = API_SCHEMAS[request.params.uri];
    if (!schema)
        throw new Error(`Unknown schema: ${request.params.uri}`);
    return {
        contents: [
            {
                uri: request.params.uri,
                mimeType: "application/schema+json",
                text: JSON.stringify(schema, null, 2),
            },
        ],
    };
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
                        text: `Get information about bedrock geology for the location ${request.params.arguments?.location} by using the Macrostrat API to find the upper most units in the area. Use long responses to get detailed information.`,
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
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});
