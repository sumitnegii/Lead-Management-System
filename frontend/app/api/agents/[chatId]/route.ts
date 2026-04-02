import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const res = await fetch(`${API}/agents/${chatId}`, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error GET /api/agents/[chatId]:", error);
    return new NextResponse("Failed to fetch agent", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const body = await request.json();
    const res = await fetch(`${API}/agents/${chatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error PUT /api/agents/[chatId]:", error);
    return new NextResponse("Failed to update agent", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const res = await fetch(`${API}/agents/${chatId}`, { method: "DELETE" });
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    return NextResponse.json(await res.json(), { status: 200 });
  } catch (error) {
    console.error("API proxy error DELETE /api/agents/[chatId]:", error);
    return new NextResponse("Failed to delete agent", { status: 500 });
  }
}
