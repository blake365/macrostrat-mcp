import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Configuration schema for smithery.yaml
export const configSchema = z.object({});
// Give up on a Macrostrat request rather than hanging the tool call forever.
const REQUEST_TIMEOUT_MS = 30_000;
function describeError(error) {
    if (error instanceof Error) {
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return `request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`;
        }
        return error.message;
    }
    return String(error);
}
function textResult(text, isError = false) {
    return { content: [{ type: "text", text }], ...(isError && { isError: true }) };
}
/** Fetch a Macrostrat JSON endpoint, reporting failures as tool errors. */
async function fetchJson(url) {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
            return textResult(`Macrostrat API returned ${response.status} ${response.statusText} for ${url}`, true);
        }
        return textResult(JSON.stringify(await response.json(), null, 2));
    }
    catch (error) {
        return textResult(`Request to ${url} failed: ${describeError(error)}`, true);
    }
}
export default function createServer({ config, }) {
    const server = new McpServer({
        name: "macrostrat",
        version: "1.0.0",
    });
    // API Schemas for resources
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
    // API Roots
    const API_ROOTS = {
        base: "https://macrostrat.org/api",
        mapUnits: "https://macrostrat.org/api/geologic_units/map",
        units: "https://macrostrat.org/api/units",
        columns: "https://macrostrat.org/api/columns",
        defs: "https://macrostrat.org/api/defs",
        tiles: "https://tiles.macrostrat.org",
    };
    function getApiEndpoint(type) {
        return API_ROOTS[type];
    }
    // Register resources
    server.registerResource("api_response", "api_response", {
        title: "API Response Wrapper Schema",
        description: "JSON schema for the standard Macrostrat API response wrapper containing success metadata and data array",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["api_response"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("units", "units", {
        title: "Units Response Schema",
        description: "JSON schema for the response from the units endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["units"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("columns", "columns", {
        title: "Columns Response Schema",
        description: "JSON schema for the response from the columns endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["columns"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("minerals", "minerals", {
        title: "Minerals Response Schema",
        description: "JSON schema for the response from the defs/minerals endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["minerals"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("lithologies", "lithologies", {
        title: "Lithologies Response Schema",
        description: "JSON schema for the response from the defs/lithologies endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["lithologies"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("environments", "environments", {
        title: "Environments Response Schema",
        description: "JSON schema for the response from the defs/environments endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["environments"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("timescales", "timescales", {
        title: "Timescales Response Schema",
        description: "JSON schema for the response from the defs/timescales endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["timescales"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("intervals", "intervals", {
        title: "Intervals Response Schema",
        description: "JSON schema for the response from the defs/intervals endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["intervals"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("econs", "econs", {
        title: "Economic Uses Response Schema",
        description: "JSON schema for the response from the defs/econs endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["econs"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("strat_names", "strat_names", {
        title: "Stratigraphic Names Response Schema",
        description: "JSON schema for the response from the defs/strat_names endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["strat_names"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("structures", "structures", {
        title: "Structures Response Schema",
        description: "JSON schema for the response from the defs/structures endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["structures"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    server.registerResource("measurements", "measurements", {
        title: "Measurements Response Schema",
        description: "JSON schema for the response from the defs/measurements endpoint",
        mimeType: "application/schema+json"
    }, async (uri) => {
        const schema = API_SCHEMAS["measurements"];
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/schema+json",
                    text: JSON.stringify(schema, null, 2),
                }]
        };
    });
    // Register tools
    server.registerTool("find-columns", {
        title: "Find Columns",
        description: "Find geological stratigraphic columns, rock layers, and geological history for any location worldwide. Use for geology, bedrock, formations, age dating, and stratigraphic analysis.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            lat: z.number().describe("A valid latitude in decimal degrees"),
            lng: z.number().describe("A valid longitude in decimal degrees"),
            adjacents: z.boolean().optional().describe("Include adjacent columns"),
            responseType: z.enum(["long", "short"]).default("long").describe("The length of response long or short"),
        }
    }, async (request) => {
        const { lat, lng, adjacents, responseType } = request;
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            adjacents: adjacents?.toString() ?? "false",
            response: responseType,
        });
        return fetchJson(`${getApiEndpoint("columns")}?${params}`);
    });
    server.registerTool("find-units", {
        title: "Find Units",
        description: "Find geological rock units, formations, bedrock geology, and mineral information for any location worldwide. Use for geology questions, rock types, age dating, lithology, and geological analysis.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            lat: z.number().describe("A valid latitude in decimal degrees"),
            lng: z.number().describe("A valid longitude in decimal degrees"),
            responseType: z.enum(["long", "short"]).default("long").describe("The length of response long or short. Long provides lots of good details"),
        }
    }, async (request) => {
        const { lat, lng, responseType } = request;
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            response: responseType,
        });
        return fetchJson(`${getApiEndpoint("units")}?${params}`);
    });
    server.registerTool("defs", {
        title: "Definitions",
        description: "Routes giving access to standard fields and dictionaries used in Macrostrat",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            endpoint: z.enum(["lithologies", "structures", "columns", "econs", "minerals", "timescales", "environments", "strat_names", "measurements", "intervals"]).describe("The endpoint to query"),
            parameters: z.string().describe("parameters to pass to the endpoint"),
        }
    }, async (request) => {
        const { endpoint, parameters } = request;
        const params = new URLSearchParams(parameters);
        return fetchJson(`${getApiEndpoint("defs")}/${endpoint}?${params}`);
    });
    server.registerTool("defs-autocomplete", {
        title: "Definitions Autocomplete",
        description: "Quickly retrieve all definitions matching a query. Limited to 100 results",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            query: z.string().describe("the search term"),
        }
    }, async (request) => {
        const { query } = request;
        const params = new URLSearchParams({ query });
        return fetchJson(`${getApiEndpoint("defs")}/autocomplete?${params}`);
    });
    server.registerTool("mineral-info", {
        title: "Mineral Information",
        description: "Get information about a mineral, use one property",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            mineral: z.string().optional().describe("The name of the mineral"),
            mineral_type: z.string().optional().describe("The type of mineral"),
            element: z.string().optional().describe("An element that the mineral is made of"),
        }
    }, async (request) => {
        const { mineral, mineral_type, element } = request;
        const params = new URLSearchParams();
        if (mineral)
            params.append("mineral", mineral);
        if (mineral_type)
            params.append("mineral_type", mineral_type);
        if (element)
            params.append("element", element);
        return fetchJson(`${getApiEndpoint("defs")}/minerals?${params}`);
    });
    server.registerTool("timescale", {
        title: "Timescale",
        description: "Get information about a time period",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            age: z.number().describe("Age in millions of years before present"),
        }
    }, async (request) => {
        const { age } = request;
        const params = new URLSearchParams({
            timescale_id: "11",
            age: age.toString(),
        });
        return fetchJson(`${getApiEndpoint("defs")}/intervals?${params}`);
    });
    server.registerTool("lat-lng-to-tile", {
        title: "Latitude/Longitude to Tile",
        description: "Convert latitude/longitude coordinates to map tile coordinates (x, y) for a given zoom level. Uses the same web mercator projection as MapKit.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
        },
        inputSchema: {
            lat: z.number().min(-90).max(90).describe("Latitude in decimal degrees (-90 to 90)"),
            lng: z.number().min(-180).max(180).describe("Longitude in decimal degrees (-180 to 180)"),
            zoom: z.number().int().min(0).max(18).describe("Zoom level (0-18)"),
        }
    }, async (request) => {
        const { lat, lng, zoom } = request;
        // Proper web mercator tile coordinate calculation (same as MapKit)
        const n = Math.pow(2, zoom);
        const x = Math.floor((lng + 180) / 360 * n);
        // Convert latitude to radians
        const lat_rad = lat * Math.PI / 180;
        // Web mercator y calculation
        const y = Math.floor((1 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2 * n);
        const data = {
            x,
            y,
            z: zoom,
            lat,
            lng,
            zoom,
            note: "Use these x,y coordinates with the map-tiles tool"
        };
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }]
        };
    });
    server.registerTool("map-tiles", {
        title: "Map Tiles",
        description: "Get map tile URLs from the Macrostrat tiles server. Use lat-lng-to-tile tool first to get proper x,y coordinates. Defaults to 'carto' scale which automatically adapts detail level to zoom.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            scale: z.enum(["carto", "tiny", "small", "medium", "large"]).default("carto").describe("Map scale layer - 'carto' automatically selects appropriate detail level based on zoom. Other scales (tiny, small, medium, large) may have limited coverage."),
            z: z.number().int().min(0).max(18).describe("Zoom level (0-18). Higher zoom = more detailed view of smaller area. Typical values: z=3 (continent), z=6 (country), z=10 (city), z=15 (neighborhood)"),
            x: z.number().int().min(0).describe("Tile X coordinate - use lat-lng-to-tile tool to calculate this from lat/lng"),
            y: z.number().int().min(0).describe("Tile Y coordinate - use lat-lng-to-tile tool to calculate this from lat/lng"),
            format: z.enum(["mvt", "png"]).default("png").describe("Tile format: 'png' for images, 'mvt' for vector tiles"),
            fetch_image: z.boolean().default(false).describe("If true, actually fetch the tile image data so Claude can analyze the geological features visually"),
        }
    }, async (request) => {
        const { scale, z, x, y, format, fetch_image } = request;
        const tileUrl = `${getApiEndpoint("tiles")}/${scale}/${z}/${x}/${y}.${format}`;
        if (fetch_image && format === "png") {
            try {
                const response = await fetch(tileUrl, {
                    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                });
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
                const data = {
                    url: tileUrl,
                    scale,
                    z,
                    x,
                    y,
                    format,
                    error: `Failed to fetch image: ${describeError(error)}`,
                    info: {
                        layers: ["units", "lines"],
                        description: scale === "carto"
                            ? "Adaptive geological map that selects appropriate detail level based on zoom"
                            : `Maps from the "${scale}" scale (may have limited geographic coverage)`,
                        license: "CC BY 4.0 International",
                        attribution: "Macrostrat and original data providers"
                    }
                };
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(data, null, 2)
                        }]
                };
            }
        }
        else {
            const data = {
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
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }]
            };
        }
    });
    // Register prompts
    server.registerPrompt("geologic-history", {
        title: "Geologic History",
        description: "Get the geologic history of a location",
        argsSchema: {
            location: z.string().describe("The location to get the geologic history of"),
        }
    }, async (args) => {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Generate a comprehensive geologic history for the location: ${args.location}. Use the Macrostrat API to find columns and units in the area. Use long responses to get detailed information.`
                    }
                }
            ]
        };
    });
    server.registerPrompt("bedrock", {
        title: "Bedrock Geology",
        description: "Get information about bedrock geology",
        argsSchema: {
            location: z.string().describe("The location to get the bedrock information of"),
        }
    }, async (args) => {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Get information about bedrock geology for the location ${args.location} by using the Macrostrat API to find the upper most units in the area. Use long responses to get detailed information.`
                    }
                }
            ]
        };
    });
    server.registerPrompt("geologic-map", {
        title: "Geologic Map",
        description: "Generate map tiles for visualizing geology of an area",
        argsSchema: {
            location: z.string().describe("The location to create a geologic map for"),
            zoom_level: z.string().optional().describe("Zoom level for the map (0-18, higher = more detailed)"),
            scale: z.string().optional().describe("Map scale: small (most coverage), medium (balanced), large (most detail)"),
        }
    }, async (args) => {
        const zoomLevel = args.zoom_level || "10";
        const scale = args.scale || "carto";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Create a geologic map visualization for ${args.location}. 

Step 1: Convert the location to precise latitude/longitude coordinates.

Step 2: Use the lat-lng-to-tile tool to convert the coordinates to tile coordinates (x, y) for zoom level ${zoomLevel}.

Step 3: Use the map-tiles tool with the calculated x, y coordinates and zoom level ${zoomLevel}, using "${scale}" scale. Set fetch_image=true to retrieve the actual tile image for visual analysis.

Step 4: Analyze the geological map tile image to identify:
- Rock unit colors and patterns
- Geological formations and structures
- Fault lines and other linear features
- Age relationships between units

Step 5: Consider getting adjacent tiles (x±1, y±1) with fetch_image=true to show a broader geological context.

Step 6: Provide both the tile URLs and detailed analysis of the geological features visible in the map images.`
                    }
                }
            ]
        };
    });
    return server.server;
}
