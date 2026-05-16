import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { query, accessToken } = await req.json();
    const result = await trashEmails(accessToken, query);

    return NextResponse.json({ 
      success: true, 
      total: result.totalDeleted,
      message: result.message 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Erro durante o processo, mas alguns e-mails podem ter sido apagados." 
    }, { status: 500 });
  }
}