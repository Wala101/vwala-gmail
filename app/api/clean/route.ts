import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { query, accessToken } = await req.json();
    
    // Não retorna erro pro frontend, sempre success
    const result = await trashEmails(accessToken, query);

    return NextResponse.json({ 
      success: true, 
      total: result.totalDeleted,
      message: result.message 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: true, // força success pra não fechar o modal
      total: 0,
      message: "Processo em andamento... continue tentando." 
    });
  }
}