import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch("http://localhost:4000/assign", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/assign:", error);
    return new NextResponse("Failed to assign lead", { status: 500 });
  }
}
