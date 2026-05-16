import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { query, accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    const total = await trashEmails(accessToken, query);

    return NextResponse.json({ 
      success: true, 
      total,
      message: `${total} e-mails movidos para a lixeira.` 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ 
      error: error.message || "Erro ao processar" 
    }, { status: 500 });
  }
}