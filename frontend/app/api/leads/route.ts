import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:4000/leads", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/leads:", error);
    return new NextResponse("Failed to fetch leads from backend", { status: 500 });
  }
}
