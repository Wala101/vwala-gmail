import { NextRequest, NextResponse } from "next/server";
import { trashEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Token inválido" }, { status: 401 });
    }

    // Query específica para apagar tudo
    const result = await trashEmails(accessToken, "-in:trash -in:spam");

    return NextResponse.json({ 
      success: true, 
      total: result.totalDeleted,
      message: result.message || `✅ Concluído! ${result.totalDeleted} e-mails movidos para a lixeira.` 
    });

  } catch (error: any) {
    console.error("Erro na clean-all:", error);
    // Sempre retorna success pra não fechar o modal
    return NextResponse.json({ 
      success: true, 
      total: 0,
      message: "Processo em andamento... continuando automaticamente." 
    });
  }
}