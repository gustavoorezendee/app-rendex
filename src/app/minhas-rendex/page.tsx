"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { buscarRendexRecomendadas, type RendexCatalogo } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { X, ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";

export default function MinhasRendexPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const [rendexRecomendadas, setRendexRecomendadas] = useState<RendexCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<RendexCatalogo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isPremium = profile?.plano === "premium";

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/minhas-rendex");
      return;
    }

    // Tentar recuperar perfil salvo do localStorage
    const savedState = localStorage.getItem("rendex-quiz-state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.rendexRecomendadas && state.rendexRecomendadas.length > 0) {
          setRendexRecomendadas(state.rendexRecomendadas);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Erro ao recuperar estado:", error);
      }
    }

    setLoading(false);
  }, [user, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
          <p className="mt-4 text-gray-600">Carregando suas RendEx...</p>
        </div>
      </div>
    );
  }

  if (rendexRecomendadas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-[#7A9CC6] hover:text-[#8A7CA8] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl text-center space-y-6">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-[#7A9CC6]">
              Você ainda não respondeu o quiz
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Para ver suas RendEx personalizadas, você precisa responder o quiz primeiro.
              Ele vai identificar o seu perfil e recomendar as melhores oportunidades para você.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 py-3 px-8 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Fazer o quiz agora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[#7A9CC6] hover:text-[#8A7CA8] mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6]">
              Minhas RendEx
            </h1>
            {isPremium && (
              <Crown className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <p className="text-lg text-gray-700">
            As 3 oportunidades mais compatíveis com o seu perfil
          </p>
          {!isPremium && (
            <div className="mt-4 inline-block bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
              💡 Com o plano Premium, você desbloqueia os guias completos passo a passo
            </div>
          )}
        </div>

        {/* Cards de RendEx */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rendexRecomendadas.map((rendex, index) => (
            <div
              key={rendex.id}
              className={`relative bg-white rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300 ${
                index === 0 ? "ring-4 ring-[#F5C6C6]" : ""
              }`}
            >
              {/* Badge de recomendação */}
              {index === 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#F5C6C6] to-[#8A7CA8] text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg">
                    ⭐ Mais recomendada
                  </div>
                </div>
              )}

              <div className="space-y-4 mt-2">
                {/* Nome */}
                <h3 className="text-2xl font-bold text-[#7A9CC6]">{rendex.nome}</h3>

                {/* Descrição */}
                <p className="text-gray-600 leading-relaxed">{rendex.descricao_curta}</p>

                {/* Categoria */}
                <div className="inline-block bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] px-3 py-1 rounded-full text-sm font-medium text-[#7A9CC6]">
                  {rendex.categoria}
                </div>

                {/* Informações */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Investimento:</span>
                    <span className="font-semibold text-[#7A9CC6]">
                      R$ {rendex.investimento_inicial}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tempo de início:</span>
                    <span className="font-semibold text-[#7A9CC6]">
                      {rendex.tempo_inicio.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Ganho inicial:</span>
                    <span className="font-semibold text-[#7A9CC6]">
                      {rendex.ganho_inicial_estimado}
                    </span>
                  </div>
                </div>

                {/* Botão de detalhes */}
                <button
                  onClick={() => {
                    setSelectedIdea(rendex);
                    setShowDetails(true);
                  }}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Ver Passo a Passo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalhes */}
      {showDetails && selectedIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header do modal */}
            <div className="sticky top-0 bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedIdea.nome}
                  </h2>
                  <p className="text-white/90">{selectedIdea.descricao_curta}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-8 space-y-6">
              {/* Primeiro passo */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  🎯 Primeiro Passo (Gratuito)
                </h3>
                <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] p-4 rounded-xl">
                  {selectedIdea.primeiro_passo}
                </p>
              </div>

              {/* Teste 24h */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  ⚡ Teste em 24 horas
                </h3>
                <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 p-4 rounded-xl">
                  {selectedIdea.teste_24h}
                </p>
              </div>

              {/* Resumo do Plano de Ação */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  📋 Plano de Ação Premium
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {isPremium
                    ? "Você tem acesso ao plano completo de 7 dias, com passos detalhados, checklists práticos e orientações exclusivas."
                    : "Desbloqueie o plano de ação completo de 7 dias, com passos detalhados, checklists práticos e orientações exclusivas para executar sua RendEx com sucesso."}
                </p>
                <button
                  onClick={() => {
                    router.push(`/plano-acao?id=${selectedIdea.id}&nome=${encodeURIComponent(selectedIdea.nome)}`);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {isPremium ? "Abrir plano de ação completo" : "Ver plano de ação (Premium)"}
                </button>
              </div>

              {/* Informações rápidas */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Investimento</div>
                  <div className="font-bold text-[#7A9CC6]">
                    R$ {selectedIdea.investimento_inicial}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Complexidade</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.complexidade}/5
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Ganho inicial</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.ganho_inicial_estimado}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Em 3 meses</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.ganho_3meses_estimado}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
