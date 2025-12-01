"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Star, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/suporte/feedback");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (rating === 0) {
      setSubmitStatus({
        type: "error",
        message: "Por favor, selecione uma avaliação com estrelas.",
      });
      return;
    }

    if (!feedback.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Por favor, escreva sua mensagem de feedback.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Obter userId e email do usuário logado
      const userId = user?.id || null;
      const email = user?.email || null;

      // Chamar rota de API
      const response = await fetch("/api/suporte/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          nota: rating,
          categoria: category || null,
          mensagem: feedback.trim(),
        }),
      });

      const result = await response.json();

      if (result.ok) {
        // Sucesso - limpar campos e mostrar mensagem
        setRating(0);
        setFeedback("");
        setCategory("");
        setSubmitStatus({
          type: "success",
          message: "Feedback enviado com sucesso! Obrigado pela sua contribuição.",
        });

        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
        }, 5000);
      } else {
        // Erro ao salvar
        setSubmitStatus({
          type: "error",
          message: "Erro ao enviar feedback. Por favor, tente novamente.",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      setSubmitStatus({
        type: "error",
        message: "Erro inesperado ao enviar feedback. Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6] dark:border-blue-500 transition-colors duration-300"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 transition-colors duration-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Botão voltar */}
        <div className="mb-8 mt-4">
          <Link
            href="/suporte"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Suporte
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 rounded-2xl mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3 transition-colors duration-300">
            Enviar Feedback
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Sua opinião é muito importante para nós! Compartilhe suas ideias e sugestões.
          </p>
        </div>

        {/* Mensagens de status */}
        {submitStatus.type && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              submitStatus.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {submitStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{submitStatus.message}</p>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avaliação com estrelas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Como você avalia a RendEx?
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={isSubmitting}
                    className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione uma categoria</option>
                <option value="interface">Interface e Design</option>
                <option value="funcionalidade">Nova Funcionalidade</option>
                <option value="conteudo">Conteúdo e RendEx</option>
                <option value="performance">Performance</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sua sugestão ou feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                disabled={isSubmitting}
                placeholder="Conte-nos o que você pensa sobre a RendEx..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Botão enviar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
