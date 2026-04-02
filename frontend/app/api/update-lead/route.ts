import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API}/update-lead`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/update-lead:", error);
    return new NextResponse("Failed to update lead", { status: 500 });
  }
}
