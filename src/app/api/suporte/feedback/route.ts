import { NextRequest, NextResponse } from "next/server";
import { salvarFeedbackRendex } from "@/server/supportActions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, nota, categoria, mensagem } = body;

    // Validação básica
    if (!mensagem || !nota || nota < 1 || nota > 5) {
      return NextResponse.json(
        { ok: false, error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Chamar a função do servidor
    const result = await salvarFeedbackRendex({
      userId: userId || null,
      email: email || null,
      nota,
      categoria: categoria || null,
      mensagem,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { ok: false, error: "Erro ao salvar feedback" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro na rota de feedback:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
