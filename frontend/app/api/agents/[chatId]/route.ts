import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const res = await fetch(`http://localhost:4000/agents/${chatId}`);
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
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
    const res = await fetch(`http://localhost:4000/agents/${chatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Failed to update agent", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const res = await fetch(`http://localhost:4000/agents/${chatId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Failed to delete agent", { status: 500 });
  }
}
