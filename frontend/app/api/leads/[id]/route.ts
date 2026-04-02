import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${API}/leads/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/leads/[id]:", error);
    return new NextResponse("Failed to fetch lead from backend", { status: 500 });
  }
}
