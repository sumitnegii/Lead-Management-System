import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const res = await fetch(`${API}/leads`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error: any) {
    console.error("API proxy error /api/leads:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch leads from backend", details: error.message, api_url: API }), { status: 500 });
  }
}
