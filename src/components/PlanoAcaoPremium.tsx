"use client";

import { useState, useEffect } from "react";
import { 
  RendexCatalogo, 
  listarProgressoRendex, 
  alternarDiaPlano,
  alternarChecklistItem 
} from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Lock, CheckCircle2, Target, ListChecks } from "lucide-react";

interface PlanoAcaoPremiumProps {
  rendex: RendexCatalogo;
  isPremium: boolean;
}

export function PlanoAcaoPremium({ rendex, isPremium }: PlanoAcaoPremiumProps) {
  const { profile } = useUserProfile();
  const planoAcao = rendex.premium_plano_acao;

  // Estados de progresso
  const [progressoDias, setProgressoDias] = useState<Record<number, boolean>>({});
  const [progressoChecklist, setProgressoChecklist] = useState<Record<string, boolean>>({});

  // Carregar progresso ao montar o componente
  useEffect(() => {
    async function carregarProgresso() {
      if (!isPremium || !profile || !rendex.id) return;

      try {
        const progresso = await listarProgressoRendex(profile.user_id, rendex.id);
        setProgressoDias(progresso.diasConcluidos);
        setProgressoChecklist(progresso.checklistConcluido);
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
      }
    }

    carregarProgresso();
  }, [isPremium, profile, rendex.id]);

  // Handler para alternar dia como concluído
  const toggleDia = async (dia: number) => {
    if (!profile || !isPremium) return;

    try {
      const novoConcluido = await alternarDiaPlano(profile.user_id, rendex.id, dia);
      setProgressoDias(prev => ({
        ...prev,
        [dia]: novoConcluido
      }));
    } catch (error) {
      console.error("Erro ao alternar dia:", error);
    }
  };

  // Handler para alternar item do checklist
  const toggleChecklistItem = async (categoria: string, item: string) => {
    if (!profile || !isPremium) return;

    const chave = `${categoria}::${item}`;

    try {
      const novoConcluido = await alternarChecklistItem(
        profile.user_id, 
        rendex.id, 
        categoria, 
        item
      );
      
      setProgressoChecklist(prev => ({
        ...prev,
        [chave]: novoConcluido
      }));
    } catch (error) {
      console.error("Erro ao alternar item do checklist:", error);
    }
  };

  // Se não existir plano de ação, não renderiza nada
  if (!planoAcao) {
    return null;
  }

  // Se não for premium, mostra teaser
  if (!isPremium) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800">
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
              onClick={() => console.log("Navegar para premium")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver como destravar o Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização completa para usuários premium
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Plano de ação da sua RendEx
        </h2>
        {planoAcao.descricao_geral && (
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {planoAcao.descricao_geral}
          </p>
        )}
      </div>

      {/* Bloco: Primeiros Passos */}
      {planoAcao.primeiros_passos && planoAcao.primeiros_passos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Primeiros passos para sair do zero
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planoAcao.primeiros_passos.map((passo, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {passo.titulo}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {passo.descricao}
                </p>
                <p className="text-sm italic text-blue-600 dark:text-blue-400 font-medium">
                  {passo.acao_pratica}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bloco: Plano de 7 dias */}
      {planoAcao.plano_7_dias && planoAcao.plano_7_dias.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Plano premium de 7 dias
            </h3>
          </div>
          <div className="space-y-4">
            {planoAcao.plano_7_dias
              .sort((a, b) => a.dia - b.dia)
              .map((dia) => {
                const diaCompleto = progressoDias[dia.dia] === true;

                return (
                  <div
                    key={dia.dia}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm transition-all ${
                      diaCompleto
                        ? "border-green-500 dark:border-green-600 ring-2 ring-green-500/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={diaCompleto}
                          onChange={() => toggleDia(dia.dia)}
                          className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              Dia {dia.dia}: {dia.titulo}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Foco: {dia.foco}
                            </p>
                          </div>
                          {diaCompleto && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                              Concluído
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Objetivo:</span> {dia.objetivo}
                        </p>
                        {dia.tarefas && dia.tarefas.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tarefas:
                            </p>
                            <ul className="space-y-2 ml-4">
                              {dia.tarefas.map((tarefa, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                );
              })}
          </div>
        </section>
      )}

      {/* Bloco: Checklist Geral */}
      {planoAcao.checklist_geral && planoAcao.checklist_geral.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ListChecks className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Checklist geral da execução
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {planoAcao.checklist_geral.map((categoria, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {categoria.categoria}
                </h4>
                <ul className="space-y-2">
                  {categoria.itens.map((item, idx) => {
                    const chave = `${categoria.categoria}::${item}`;
                    const itemConcluido = progressoChecklist[chave] === true;

                    return (
                      <li key={idx} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={itemConcluido}
                          onChange={() => toggleChecklistItem(categoria.categoria, item)}
                          className="w-5 h-5 mt-0.5 rounded border-2 border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        />
                        <span
                          className={`text-sm flex-1 ${
                            itemConcluido
                              ? "text-purple-600 dark:text-purple-400 line-through"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {item}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mensagem Final */}
      {planoAcao.mensagem_final && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-center text-gray-700 dark:text-gray-300 italic">
            {planoAcao.mensagem_final}
          </p>
        </div>
      )}
    </div>
  );
}
