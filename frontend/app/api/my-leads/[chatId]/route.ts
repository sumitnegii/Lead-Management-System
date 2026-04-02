import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    if (!chatId) return new NextResponse("chatId is required", { status: 400 });
    const res = await fetch(`${API}/my-leads/${chatId}`, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error /api/my-leads:", error);
    return new NextResponse("Failed to fetch agent leads from backend", { status: 500 });
  }
}
