import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return new NextResponse("chatId is required", { status: 400 });
    }

    const res = await fetch(`http://localhost:4000/my-leads/${chatId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/my-leads:", error);
    return new NextResponse("Failed to fetch agent leads from backend", { status: 500 });
  }
}
