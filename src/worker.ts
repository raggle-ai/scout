import catalog from "../catalog.json";
import providers from "../providers.json";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
};

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/api.json") {
      return Response.json(providers, { headers: jsonHeaders });
    }

    if (url.pathname === "/catalog.json" || url.pathname === "/api/v1/catalog.json") {
      return Response.json(catalog, { headers: jsonHeaders });
    }

    return new Response("Not found", { status: 404 });
  },
};
