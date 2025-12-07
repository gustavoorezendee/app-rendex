import { NextRequest, NextResponse } from "next/server";
import { salvarProblemaRendex } from "@/server/supportActions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, gravidade, origem, titulo, descricao, deviceInfo } = body;

    // Validação básica
    if (!gravidade || !titulo || !descricao) {
      return NextResponse.json(
        { ok: false, error: "Parâmetros obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Chamar a função do servidor
    const result = await salvarProblemaRendex({
      userId: userId || null,
      email: email || null,
      gravidade,
      origem: origem || "Não especificado",
      titulo,
      descricao,
      deviceInfo: deviceInfo || null,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { ok: false, error: "Erro ao salvar problema" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro na rota de reportar problema:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
