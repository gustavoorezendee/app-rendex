"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase, type RendexCatalogo } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { X, ArrowLeft, Search, Crown } from "lucide-react";
import Link from "next/link";

export default function CatalogoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const [todasRendex, setTodasRendex] = useState<RendexCatalogo[]>([]);
  const [filteredRendex, setFilteredRendex] = useState<RendexCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<RendexCatalogo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  const isPremium = profile?.plano === "premium";

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/catalogo");
      return;
    }

    // Buscar todas as RendEx do catálogo
    const fetchAllRendex = async () => {
      try {
        const { data, error } = await supabase
          .from("rendex_catalogo")
          .select("*")
          .eq("ativo", true)
          .order("nome", { ascending: true });

        if (error) {
          console.error("Erro ao buscar catálogo:", error);
        } else {
          setTodasRendex(data || []);
          setFilteredRendex(data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar catálogo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRendex();
  }, [user, router]);

  // Filtrar RendEx por busca e categoria
  useEffect(() => {
    let filtered = todasRendex;

    // Filtrar por categoria
    if (selectedCategory !== "todas") {
      filtered = filtered.filter((r) => r.categoria === selectedCategory);
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.descricao_curta.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRendex(filtered);
  }, [searchTerm, selectedCategory, todasRendex]);

  // Extrair categorias únicas
  const categorias = ["todas", ...Array.from(new Set(todasRendex.map((r) => r.categoria)))];

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6] dark:border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6] dark:text-blue-400">
              Catálogo Completo
            </h1>
            {isPremium && (
              <Crown className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Explore todas as {todasRendex.length} oportunidades disponíveis
          </p>
          {!isPremium && (
            <div className="mt-4 inline-block bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-lg text-sm">
              💡 Com o plano Premium, você desbloqueia os guias completos de todas as RendEx
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
                }`}
              >
                {cat === "todas" ? "Todas" : cat}
              </button>
            ))}
          </div>

          {/* Contador */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredRendex.length} de {todasRendex.length} oportunidades
          </div>
        </div>

        {/* Grid de RendEx */}
        {filteredRendex.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Nenhuma RendEx encontrada com os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRendex.map((rendex) => (
              <div
                key={rendex.id}
                className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Nome */}
                  <h3 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400">{rendex.nome}</h3>

                  {/* Descrição */}
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {rendex.descricao_curta}
                  </p>

                  {/* Categoria */}
                  <div className="inline-block bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/50 dark:to-pink-900/50 px-3 py-1 rounded-full text-sm font-medium text-[#7A9CC6] dark:text-blue-400">
                    {rendex.categoria}
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Investimento:</span>
                      <span className="font-semibold text-[#7A9CC6] dark:text-blue-400">
                        R$ {rendex.investimento_inicial}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Complexidade:</span>
                      <span className="font-semibold text-[#7A9CC6] dark:text-blue-400">
                        {rendex.complexidade}/5
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Ganho inicial:</span>
                      <span className="font-semibold text-[#7A9CC6] dark:text-blue-400">
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
                    className="w-full mt-4 py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showDetails && selectedIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header do modal */}
            <div className="sticky top-0 bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] dark:from-blue-600 dark:to-pink-600 p-6 rounded-t-3xl">
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
                <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
                  🎯 Primeiro Passo (Gratuito)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-pink-900/30 p-4 rounded-xl">
                  {selectedIdea.primeiro_passo}
                </p>
              </div>

              {/* Teste 24h */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
                  ⚡ Teste em 24 horas
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 dark:from-pink-900/30 dark:to-rose-900/30 p-4 rounded-xl">
                  {selectedIdea.teste_24h}
                </p>
              </div>

              {/* Resumo do Plano de Ação */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
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
                  className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {isPremium ? "Abrir plano de ação completo" : "Ver plano de ação (Premium)"}
                </button>
              </div>

              {/* Informações rápidas */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Investimento</div>
                  <div className="font-bold text-[#7A9CC6] dark:text-blue-400">
                    R$ {selectedIdea.investimento_inicial}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Complexidade</div>
                  <div className="font-bold text-[#7A9CC6] dark:text-blue-400">
                    {selectedIdea.complexidade}/5
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ganho inicial</div>
                  <div className="font-bold text-[#7A9CC6] dark:text-blue-400">
                    {selectedIdea.ganho_inicial_estimado}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Em 3 meses</div>
                  <div className="font-bold text-[#7A9CC6] dark:text-blue-400">
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
