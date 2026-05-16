import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { query, accessToken } = await req.json();
    const total = await trashEmails(accessToken, query);

    return NextResponse.json({ success: true, total });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}