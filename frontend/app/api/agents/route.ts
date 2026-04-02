import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${API}/agents`, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/agents:", error);
    return new NextResponse("Failed to fetch agents", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 201 });
  } catch (error) {
    console.error("API proxy error POST /api/agents:", error);
    return new NextResponse("Failed to create agent", { status: 500 });
  }
}
