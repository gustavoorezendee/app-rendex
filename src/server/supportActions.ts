"use server";

import { supabase } from "@/lib/supabase";
import { enviarEmailSuporte } from "@/lib/email";

/**
 * Salva feedback do usuário na tabela user_feedbacks
 * Esta função roda APENAS no servidor
 */
export async function salvarFeedbackRendex(params: {
  userId: string | null;
  email: string | null;
  nota: number;
  categoria: string | null;
  mensagem: string;
}): Promise<{ ok: boolean; error?: unknown }> {
  const { userId, email, nota, categoria, mensagem } = params;

  // Validação básica
  if (!mensagem || nota < 1 || nota > 5) {
    return { ok: false, error: "Parâmetros inválidos" };
  }

  try {
    // Montar o assunto conforme especificado
    const assunto = `Feedback | Nota: ${nota} | Categoria: ${categoria || "Não especificada"}`;

    const { error } = await supabase.from("user_feedbacks").insert({
      user_id: userId,
      email: email,
      assunto: assunto,
      mensagem: mensagem,
    });

    if (error) {
      console.error("Erro ao salvar feedback:", error);
      return { ok: false, error };
    }

    // Após salvar com sucesso, enviar e-mail
    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Novo Feedback Recebido na RendEx</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nota:</strong> ${nota} ⭐</p>
          <p><strong>Categoria:</strong> ${categoria || "Não especificada"}</p>
          <p><strong>E-mail do usuário:</strong> ${email || "Não fornecido"}</p>
        </div>
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #555; margin-top: 0;">Mensagem:</h3>
          <p style="color: #333; line-height: 1.6;">${mensagem}</p>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
          Este e-mail foi gerado automaticamente pelo sistema de feedback da RendEx.
        </p>
      </div>
    `;

    // Tentar enviar e-mail, mas não falhar se der erro
    try {
      await enviarEmailSuporte({
        subject: "Novo feedback na RendEx",
        html: htmlEmail,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de feedback (não crítico):", emailError);
    }

    return { ok: true };
  } catch (error) {
    console.error("Erro ao salvar feedback:", error);
    return { ok: false, error };
  }
}

/**
 * Salva problema reportado pelo usuário na tabela support_issues
 * Esta função roda APENAS no servidor
 */
export async function salvarProblemaRendex(params: {
  userId: string | null;
  email: string | null;
  gravidade: string;
  origem: string;
  titulo: string;
  descricao: string;
  deviceInfo: string | null;
}): Promise<{ ok: boolean; error?: unknown }> {
  const { userId, email, gravidade, origem, titulo, descricao, deviceInfo } = params;

  // Validação básica
  if (!gravidade || !titulo || !descricao) {
    return { ok: false, error: "Parâmetros obrigatórios faltando" };
  }

  try {
    // Montar a categoria conforme especificado
    const categoria = `${gravidade} | ${origem} | ${titulo}`;

    const { error } = await supabase.from("support_issues").insert({
      user_id: userId,
      email: email,
      categoria: categoria,
      descricao: descricao,
      device_info: deviceInfo,
    });

    if (error) {
      console.error("Erro ao salvar problema:", error);
      return { ok: false, error };
    }

    // Após salvar com sucesso, enviar e-mail
    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Novo Problema Reportado na RendEx</h2>
        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Gravidade:</strong> <span style="color: #d32f2f;">${gravidade}</span></p>
          <p><strong>Origem:</strong> ${origem}</p>
          <p><strong>Título:</strong> ${titulo}</p>
          <p><strong>E-mail do usuário:</strong> ${email || "Não fornecido"}</p>
        </div>
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">Descrição do Problema:</h3>
          <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${descricao}</p>
        </div>
        ${
          deviceInfo
            ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #666; margin-top: 0;">Informações do Dispositivo:</h4>
          <p style="color: #555; font-size: 12px; font-family: monospace;">${deviceInfo}</p>
        </div>
        `
            : ""
        }
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
          Este e-mail foi gerado automaticamente pelo sistema de suporte da RendEx.
        </p>
      </div>
    `;

    // Tentar enviar e-mail, mas não falhar se der erro
    try {
      await enviarEmailSuporte({
        subject: "Novo problema reportado na RendEx",
        html: htmlEmail,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de problema (não crítico):", emailError);
    }

    return { ok: true };
  } catch (error) {
    console.error("Erro ao salvar problema:", error);
    return { ok: false, error };
  }
}
