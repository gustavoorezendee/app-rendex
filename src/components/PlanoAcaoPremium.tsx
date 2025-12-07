"use client";

import { useState, useEffect } from "react";
import { 
  RendexCatalogo, 
  listarProgressoRendex, 
  alternarChecklistItem 
} from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Lock, CheckCircle2, Target, ListChecks, Calendar, ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanoAcaoPremiumProps {
  rendex: RendexCatalogo;
  isPremium: boolean;
}

export function PlanoAcaoPremium({ rendex, isPremium }: PlanoAcaoPremiumProps) {
  // Padrão de montagem para evitar problemas de hidratação
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { profile } = useUserProfile();
  const planoAcao = rendex.premium_plano_acao;

  // Estado apenas para o checklist geral
  const [checklistProgresso, setChecklistProgresso] = useState<Record<string, boolean>>({});
  const [feedbackSalvo, setFeedbackSalvo] = useState<string | null>(null);

  // Carregar progresso do checklist ao montar o componente
  useEffect(() => {
    async function carregarProgresso() {
      if (!isPremium || !profile || !rendex.id) return;

      try {
        const progresso = await listarProgressoRendex(profile.user_id, rendex.id);
        
        // Montar objeto de progresso do checklist
        const checklistMap: Record<string, boolean> = {};
        progresso.forEach((item) => {
          if (item.checklist_categoria && item.checklist_item) {
            const key = `${item.checklist_categoria}::${item.checklist_item}`;
            checklistMap[key] = item.concluido;
          }
        });
        
        setChecklistProgresso(checklistMap);
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
      }
    }

    carregarProgresso();
  }, [isPremium, profile, rendex.id]);

  // Handler para alternar item do checklist
  const handleToggleChecklist = async (categoria: string, item: string) => {
    if (!profile || !isPremium) {
      console.warn("Usuário não está logado ou não é premium");
      return;
    }

    if (!rendex.id) {
      console.warn("rendexId não disponível");
      return;
    }

    const key = `${categoria}::${item}`;
    const estadoAnterior = !!checklistProgresso[key];
    const novoEstado = !estadoAnterior;
    
    // Atualização otimista do estado
    setChecklistProgresso(prev => ({
      ...prev,
      [key]: novoEstado
    }));

    // Salvar no banco em segundo plano
    try {
      const sucesso = await alternarChecklistItem(
        profile.user_id, 
        rendex.id, 
        categoria, 
        item
      );
      
      if (sucesso) {
        // Feedback visual de sucesso
        setFeedbackSalvo(categoria);
        setTimeout(() => setFeedbackSalvo(null), 1500);
      } else {
        // Reverter em caso de erro
        setChecklistProgresso(prev => ({
          ...prev,
          [key]: estadoAnterior
        }));
        console.error("Falha ao salvar item do checklist");
      }
    } catch (error) {
      // Reverter em caso de erro
      setChecklistProgresso(prev => ({
        ...prev,
        [key]: estadoAnterior
      }));
      console.error("Falha ao salvar item do checklist", error);
    }
  };

  // Evita problemas de hidratação entre server e client
  if (!isMounted) {
    return null;
  }

  // Se não existir plano de ação, não renderiza nada
  if (!planoAcao) {
    return null;
  }

  // Se não for premium, mostra teaser
  if (!isPremium) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800 transition-colors duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Plano de ação da sua RendEx
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Desbloqueie o plano de ação completo de 7 dias, com passos detalhados, 
              checklists práticos e orientações exclusivas para executar sua RendEx com sucesso.
            </p>
            <button
              onClick={() => router.push("/plano")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver como destravar o Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização completa para usuários premium - PÁGINA DEDICADA
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-12 transition-colors duration-300">
      {/* Header da página */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/home")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              aria-label="Voltar para Home"
            >
              <ArrowLeft className="w-6 h-6 text-[#7A9CC6] dark:text-blue-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400">
                {rendex.nome}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plano de ação completo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Descrição geral */}
        {planoAcao.descricao_geral && (
          <div className="text-center max-w-3xl mx-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 transition-colors duration-300">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {planoAcao.descricao_geral}
            </p>
          </div>
        )}

        {/* Bloco: Primeiros Passos */}
        {planoAcao.primeiros_passos && planoAcao.primeiros_passos.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl shadow-sm">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Primeiros passos para sair do zero
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {planoAcao.primeiros_passos.map((passo, index) => (
                <div
                  key={index}
                  className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      {passo.titulo}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {passo.descricao}
                  </p>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{passo.acao_pratica}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bloco: Plano de 7 dias - APENAS INFORMATIVO (SEM CHECKBOXES) */}
        {planoAcao.plano_7_dias && planoAcao.plano_7_dias.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl shadow-sm">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Plano premium de 7 dias
              </h2>
            </div>
            <div className="space-y-5">
              {planoAcao.plano_7_dias
                .sort((a, b) => a.dia - b.dia)
                .map((dia) => (
                  <div
                    key={dia.dia}
                    className="group bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 md:gap-6">
                      {/* Número do dia destacado */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <div className="text-center">
                            <div className="text-xs text-white/80 font-medium">DIA</div>
                            <div className="text-2xl md:text-3xl font-bold text-white">{dia.dia}</div>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do dia */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {dia.titulo}
                          </h3>
                          <div className="inline-block px-3 py-1 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-full">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              Foco: {dia.foco}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl p-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Objetivo:</span> {dia.objetivo}
                          </p>
                        </div>

                        {dia.tarefas && dia.tarefas.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Tarefas do dia:
                            </p>
                            <ul className="space-y-2">
                              {dia.tarefas.map((tarefa, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                                    {tarefa}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Bloco: Checklist Geral - COM CHECKBOXES INTERATIVOS */}
        {planoAcao.checklist_geral && planoAcao.checklist_geral.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl shadow-sm">
                <ListChecks className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Checklist geral da execução
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {planoAcao.checklist_geral.map((categoria, index) => {
                const categoriaConcluida = feedbackSalvo === categoria.categoria;
                
                return (
                  <div
                    key={index}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 shadow-md hover:shadow-xl transition-all duration-300 ${
                      categoriaConcluida 
                        ? 'border-green-400 dark:border-green-500' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Feedback visual de salvamento */}
                    {categoriaConcluida && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                      {categoria.categoria}
                    </h3>
                    <ul className="space-y-3">
                      {categoria.itens.map((item, idx) => {
                        const key = `${categoria.categoria}::${item}`;
                        const itemConcluido = !!checklistProgresso[key];

                        return (
                          <li key={idx} className="flex items-start gap-3 group">
                            <div className="relative flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={itemConcluido}
                                onChange={() => handleToggleChecklist(categoria.categoria, item)}
                                className="peer w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 cursor-pointer transition-all duration-200 hover:scale-110 checked:scale-100 checked:border-purple-500 dark:checked:border-purple-400 bg-white dark:bg-gray-700"
                              />
                              {/* Animação de check */}
                              <div className="absolute inset-0 pointer-events-none">
                                <div className={`w-full h-full rounded transition-all duration-200 ${
                                  itemConcluido 
                                    ? 'bg-purple-500/20 scale-150 opacity-0' 
                                    : 'scale-100 opacity-0'
                                }`}></div>
                              </div>
                            </div>
                            <span
                              className={`text-sm flex-1 leading-relaxed transition-all duration-200 ${
                                itemConcluido
                                  ? "text-gray-400 dark:text-gray-500 line-through"
                                  : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                              }`}
                            >
                              {item}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Mensagem Final */}
        {planoAcao.mensagem_final && (
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 shadow-lg transition-colors duration-300">
            <p className="text-center text-gray-700 dark:text-gray-300 text-lg leading-relaxed italic">
              {planoAcao.mensagem_final}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
