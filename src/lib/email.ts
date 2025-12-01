import { Resend } from "resend";

// Instancia o Resend com a chave da variável de ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

interface EnviarEmailSuporteParams {
  subject: string;
  html: string;
  to?: string;
}

/**
 * Envia um e-mail para o suporte usando Resend
 * @param params - Objeto com subject, html e to (opcional)
 * @returns { ok: true } se sucesso, { ok: false } se erro
 */
export async function enviarEmailSuporte(params: EnviarEmailSuporteParams) {
  const { subject, html, to = "suporte@rendexapp.com.br" } = params;

  try {
    await resend.emails.send({
      from: "suporte@rendexapp.com.br",
      to,
      subject,
      html,
    });

    return { ok: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return { ok: false };
  }
}
