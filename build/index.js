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
    api_response: {
        type: "object",
        properties: {
            success: {
                type: "object",
                properties: {
                    v: {
                        type: "integer",
                        description: "API version number"
                    },
                    license: {
                        type: "string",
                        description: "Data license (typically CC-BY 4.0)"
                    },
                    data: {
                        type: "array",
                        description: "Array of data objects - structure depends on endpoint",
                        items: { type: "object" }
                    }
                },
                required: ["data"]
            }
        },
        required: ["success"]
    },
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
            unit_name: { type: ["string", "null"], description: "the name of the unit" },
            strat_name_id: {
                type: ["integer", "null"],
                description: "unique identifier for known stratigraphic name(s) (see /defs/strat_names)",
            },
            Mbr: { type: ["string", "null"], description: "lithostratigraphic member" },
            Fm: { type: ["string", "null"], description: "lithostratigraphic formation" },
            Gp: { type: ["string", "null"], description: "lithostratigraphic group" },
            SGp: { type: ["string", "null"], description: "lithostratigraphic supergroup" },
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
                description: "describes where unit is exposed or not, values are 'outcrop', 'subsurface', or 'both'",
                enum: ["outcrop", "subsurface", "both"]
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
                type: ["string", "null"],
                description: "specific lithology, see /defs/lithologies",
            },
            environ: {
                type: ["string", "null"],
                description: "specific environment, see /defs/environments",
            },
            econ: {
                type: ["string", "null"],
                description: "name of economic use, see defs/econs",
            },
            measure: {
                type: ["array", "null"],
                description: "summary of types of measurements available",
                items: { type: "string" }
            },
            notes: {
                type: ["string", "null"],
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
            col_name: { type: ["string", "null"], description: "name of column" },
            lat: { type: "number", description: "latitude in WGS84" },
            lng: { type: "number", description: "longitude in WGS84" },
            col_group: {
                type: ["string", "null"],
                description: "name of group the column belongs to, generally corresponds to geologic provinces",
            },
            col_group_id: {
                type: ["integer", "null"],
                description: "the ID of the group to which the column belongs",
            },
            group_col_id: {
                type: ["number", "null"],
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
                type: ["string", "null"],
                description: "specific lithology, see /defs/lithologies",
            },
            environ: {
                type: ["string", "null"],
                description: "specific environment, see /defs/environments",
            },
            econ: {
                type: ["string", "null"],
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
                type: ["number", "null"],
                description: "minimum value for Moh's hardness scale",
            },
            hardness_max: {
                type: ["number", "null"],
                description: "maximum value for Moh's hardness scale",
            },
            mineral_color: {
                type: ["string", "null"],
                description: "color description of mineral",
            },
            lustre: {
                type: ["string", "null"],
                description: "description of mineral lustre"
            },
            crystal_form: {
                type: ["string", "null"],
                description: "crystal form of mineral"
            },
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
    lithologies: {
        type: "object",
        properties: {
            lith_id: {
                type: "integer",
                description: "unique ID of the lithology",
            },
            name: {
                type: "string",
                description: "the name of the entity",
            },
            group: {
                type: ["string", "null"],
                description: "definition group, less inclusive than type",
            },
            type: {
                type: ["string", "null"],
                description: "definition type, less inclusive than class",
            },
            class: {
                type: ["string", "null"],
                description: "definition class, more inclusive than type",
            },
            color: {
                type: ["string", "null"],
                description: "recommended coloring for units based on dominant lithology",
            },
        },
    },
    environments: {
        type: "object",
        properties: {
            environ_id: {
                type: "integer",
                description: "unique identifier for the environment",
            },
            name: {
                type: "string",
                description: "name of the entity",
            },
            type: {
                type: ["string", "null"],
                description: "definition type, less inclusive than class",
            },
            class: {
                type: ["string", "null"],
                description: "definition class, more inclusive than type",
            },
            color: {
                type: ["string", "null"],
                description: "recommended coloring for units based on dominant lithology",
            },
        },
    },
    timescales: {
        type: "object",
        properties: {
            timescale_id: {
                type: "integer",
                description: "unique identifier",
            },
            timescale: {
                type: "string",
                description: "timescale name",
            },
            max_age: {
                type: "string",
                description: "maximum age using International time scale",
            },
            min_age: {
                type: "string",
                description: "minimum age using International time scale",
            },
            n_intervals: {
                type: "integer",
                description: "count of intervals in timescale",
            },
            ref_id: {
                type: "integer",
                description: "unique reference identifier",
            },
        },
    },
    intervals: {
        type: "object",
        properties: {
            int_id: {
                type: "integer",
                description: "unique interval identifier",
            },
            name: {
                type: "string",
                description: "name of the interval",
            },
            abbrev: {
                type: "string",
                description: "standard abbreviation for interval name",
            },
            t_age: {
                type: "number",
                description: "truncation age in millions of years before present",
            },
            b_age: {
                type: "number",
                description: "initiation age in millions of years before present",
            },
            int_type: {
                type: "string",
                description: "temporal rank of the interval",
            },
            color: {
                type: "string",
                description: "recommended color based on dominant lithology",
            },
        },
    },
    econs: {
        type: "object",
        properties: {
            econ_id: {
                type: "integer",
                description: "unique econ identifier",
            },
            name: {
                type: "string",
                description: "name of the entity",
            },
            type: {
                type: ["string", "null"],
                description: "definition type, less inclusive than class",
            },
            class: {
                type: ["string", "null"],
                description: "definition class, more inclusive than type",
            },
            color: {
                type: ["string", "null"],
                description: "recommended coloring for units based on dominant lithology",
            },
        },
    },
    strat_names: {
        type: "object",
        properties: {
            strat_name: {
                type: ["string", "null"],
                description: "informal unit name",
            },
            rank: {
                type: ["string", "null"],
                description: "stratigraphic rank of the unit",
            },
            strat_name_id: {
                type: "integer",
                description: "unique identifier",
            },
            concept_id: {
                type: ["integer", "null"],
                description: "unique identifier for stratigraphic name concept",
            },
            bed: {
                type: ["string", "null"],
                description: "bed name",
            },
            bed_id: {
                type: ["integer", "null"],
                description: "bed identifier",
            },
            mbr: {
                type: ["string", "null"],
                description: "member name",
            },
            mbr_id: {
                type: ["integer", "null"],
                description: "member identifier",
            },
            fm: {
                type: ["string", "null"],
                description: "formation name",
            },
            fm_id: {
                type: ["integer", "null"],
                description: "formation identifier",
            },
            gp: {
                type: ["string", "null"],
                description: "group name",
            },
            gp_id: {
                type: ["integer", "null"],
                description: "group identifier",
            },
            sgp: {
                type: ["string", "null"],
                description: "supergroup name",
            },
            sgp_id: {
                type: ["integer", "null"],
                description: "supergroup identifier",
            },
            b_age: {
                type: ["number", "null"],
                description: "estimated initiation time (Myr before present)",
            },
            t_age: {
                type: ["number", "null"],
                description: "estimated truncation time (Myr before present)",
            },
            ref_id: {
                type: ["integer", "null"],
                description: "unique reference identifier",
            },
        },
    },
    structures: {
        type: "object",
        properties: {
            structure_id: {
                type: "integer",
                description: "unique structure ID",
            },
            name: {
                type: "string",
                description: "name of the entity",
            },
            group: {
                type: ["string", "null"],
                description: "definition group, less inclusive than type",
            },
            type: {
                type: ["string", "null"],
                description: "definition type, less inclusive than class",
            },
            class: {
                type: ["string", "null"],
                description: "definition class, more inclusive than type",
            },
        },
    },
    measurements: {
        type: "object",
        properties: {
            measure_id: {
                type: "integer",
                description: "unique ID of the measurement",
            },
            name: {
                type: "string",
                description: "name of the entity",
            },
            type: {
                type: ["string", "null"],
                description: "definition type, less inclusive than class",
            },
            class: {
                type: ["string", "null"],
                description: "definition class, more inclusive than type",
            },
            t_units: {
                type: "integer",
                description: "total units",
            },
        },
    },
};
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [
        {
            uri: "api_response",
            name: "API Response Wrapper Schema",
            description: "JSON schema for the standard Macrostrat API response wrapper containing success metadata and data array",
        },
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
        {
            uri: "lithologies",
            name: "Lithologies Response Schema",
            description: "JSON schema for the response from the defs/lithologies endpoint",
        },
        {
            uri: "environments",
            name: "Environments Response Schema",
            description: "JSON schema for the response from the defs/environments endpoint",
        },
        {
            uri: "timescales",
            name: "Timescales Response Schema",
            description: "JSON schema for the response from the defs/timescales endpoint",
        },
        {
            uri: "intervals",
            name: "Intervals Response Schema",
            description: "JSON schema for the response from the defs/intervals endpoint",
        },
        {
            uri: "econs",
            name: "Economic Uses Response Schema",
            description: "JSON schema for the response from the defs/econs endpoint",
        },
        {
            uri: "strat_names",
            name: "Stratigraphic Names Response Schema",
            description: "JSON schema for the response from the defs/strat_names endpoint",
        },
        {
            uri: "structures",
            name: "Structures Response Schema",
            description: "JSON schema for the response from the defs/structures endpoint",
        },
        {
            uri: "measurements",
            name: "Measurements Response Schema",
            description: "JSON schema for the response from the defs/measurements endpoint",
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
    {
        type: "api",
        uri: "https://tiles.macrostrat.org",
        name: "Macrostrat Tiles API",
        description: "Endpoint for querying map tiles with geologic data",
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
    "geologic-map": {
        name: "geologic-map",
        description: "Generate map tiles for visualizing geology of an area",
        arguments: [
            {
                name: "location",
                description: "The location to create a geologic map for",
                type: "string",
                required: true,
            },
            {
                name: "zoom_level",
                description: "Zoom level for the map (0-18, higher = more detailed)",
                type: "string",
                required: false,
            },
            {
                name: "scale",
                description: "Map scale: small (most coverage), medium (balanced), large (most detail)",
                type: "string",
                required: false,
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
    if (request.params.name === "geologic-map") {
        const zoomLevel = request.params.arguments?.zoom_level || "10";
        const scale = request.params.arguments?.scale || "carto";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Create a geologic map visualization for ${request.params.arguments?.location}. 

Step 1: Convert the location to precise latitude/longitude coordinates.

Step 2: Use the lat-lng-to-tile tool to convert the coordinates to tile coordinates (x, y) for zoom level ${zoomLevel}.

Step 3: Use the map-tiles tool with the calculated x, y coordinates and zoom level ${zoomLevel}, using "${scale}" scale. Set fetch_image=true to retrieve the actual tile image for visual analysis.

Step 4: Analyze the geological map tile image to identify:
- Rock unit colors and patterns
- Geological formations and structures
- Fault lines and other linear features
- Age relationships between units

Step 5: Consider getting adjacent tiles (x±1, y±1) with fetch_image=true to show a broader geological context.

Step 6: Provide both the tile URLs and detailed analysis of the geological features visible in the map images.`,
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
            {
                name: "lat-lng-to-tile",
                description: "Convert latitude/longitude coordinates to map tile coordinates (x, y) for a given zoom level. Uses the same web mercator projection as MapKit.",
                inputSchema: {
                    type: "object",
                    properties: {
                        lat: {
                            type: "number",
                            description: "Latitude in decimal degrees (-90 to 90)",
                            minimum: -90,
                            maximum: 90,
                        },
                        lng: {
                            type: "number",
                            description: "Longitude in decimal degrees (-180 to 180)",
                            minimum: -180,
                            maximum: 180,
                        },
                        zoom: {
                            type: "integer",
                            description: "Zoom level (0-18)",
                            minimum: 0,
                            maximum: 18,
                        },
                    },
                    required: ["lat", "lng", "zoom"],
                },
            },
            {
                name: "map-tiles",
                description: "Get map tile URLs from the Macrostrat tiles server. Use lat-lng-to-tile tool first to get proper x,y coordinates. Defaults to 'carto' scale which automatically adapts detail level to zoom.",
                inputSchema: {
                    type: "object",
                    properties: {
                        scale: {
                            type: "string",
                            description: "Map scale layer - 'carto' automatically selects appropriate detail level based on zoom. Other scales (tiny, small, medium, large) may have limited coverage.",
                            enum: ["carto", "tiny", "small", "medium", "large"],
                            default: "carto",
                        },
                        z: {
                            type: "integer",
                            description: "Zoom level (0-18). Higher zoom = more detailed view of smaller area. Typical values: z=3 (continent), z=6 (country), z=10 (city), z=15 (neighborhood)",
                            minimum: 0,
                            maximum: 18,
                        },
                        x: {
                            type: "integer",
                            description: "Tile X coordinate - use lat-lng-to-tile tool to calculate this from lat/lng",
                            minimum: 0,
                        },
                        y: {
                            type: "integer",
                            description: "Tile Y coordinate - use lat-lng-to-tile tool to calculate this from lat/lng",
                            minimum: 0,
                        },
                        format: {
                            type: "string",
                            description: "Tile format: 'png' for images, 'mvt' for vector tiles",
                            enum: ["mvt", "png"],
                            default: "png",
                        },
                        fetch_image: {
                            type: "boolean",
                            description: "If true, actually fetch the tile image data so Claude can analyze the geological features visually",
                            default: false,
                        },
                    },
                    required: ["z", "x", "y"]
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
        const params = new URLSearchParams(parameters);
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
    else if (request.params.name === "lat-lng-to-tile") {
        const { lat, lng, zoom } = request.params.arguments;
        // Proper web mercator tile coordinate calculation (same as MapKit)
        const n = Math.pow(2, zoom);
        const x = Math.floor((lng + 180) / 360 * n);
        // Convert latitude to radians
        const lat_rad = lat * Math.PI / 180;
        // Web mercator y calculation
        const y = Math.floor((1 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2 * n);
        data = {
            x,
            y,
            z: zoom,
            lat,
            lng,
            zoom,
            note: "Use these x,y coordinates with the map-tiles tool"
        };
    }
    else if (request.params.name === "map-tiles") {
        const { scale = "carto", z, x, y, format = "png", fetch_image = false } = request.params.arguments;
        const tileUrl = `https://tiles.macrostrat.org/${scale}/${z}/${x}/${y}.${format}`;
        if (fetch_image && format === "png") {
            try {
                const response = await fetch(tileUrl);
                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString('base64');
                    // Return both text info and image content
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    url: tileUrl,
                                    scale,
                                    z,
                                    x,
                                    y,
                                    format,
                                    info: {
                                        layers: ["units", "lines"],
                                        description: scale === "carto"
                                            ? "Adaptive geological map that selects appropriate detail level based on zoom"
                                            : `Maps from the "${scale}" scale (may have limited geographic coverage)`,
                                        license: "CC BY 4.0 International",
                                        attribution: "Macrostrat and original data providers",
                                        note: "Geological map tile image provided below for visual analysis"
                                    }
                                }, null, 2)
                            },
                            {
                                type: "image",
                                data: base64,
                                mimeType: "image/png"
                            },
                        ],
                    };
                }
                else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            catch (error) {
                console.error("Error fetching tile image:", error);
                data = {
                    url: tileUrl,
                    scale,
                    z,
                    x,
                    y,
                    format,
                    error: `Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`,
                    info: {
                        layers: ["units", "lines"],
                        description: scale === "carto"
                            ? "Adaptive geological map that selects appropriate detail level based on zoom"
                            : `Maps from the "${scale}" scale (may have limited geographic coverage)`,
                        license: "CC BY 4.0 International",
                        attribution: "Macrostrat and original data providers"
                    }
                };
            }
        }
        else {
            data = {
                url: tileUrl,
                scale,
                z,
                x,
                y,
                format,
                info: {
                    layers: ["units", "lines"],
                    description: scale === "carto"
                        ? "Adaptive geological map that selects appropriate detail level based on zoom"
                        : `Maps from the "${scale}" scale (may have limited geographic coverage)`,
                    license: "CC BY 4.0 International",
                    attribution: "Macrostrat and original data providers"
                }
            };
        }
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
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});
