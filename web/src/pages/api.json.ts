import providers from "../../../providers.json";

export const prerender = true;

export function GET() {
  return Response.json(providers, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
