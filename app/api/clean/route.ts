import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { query, accessToken, options } = await req.json();
    const result = await trashEmails(accessToken, query, options);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}