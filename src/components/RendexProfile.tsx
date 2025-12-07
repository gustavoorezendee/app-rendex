"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RendexProfileProps {
  userId: string;
}

interface Stage {
  id: string;
  name: string;
  patent: string;
  order_index: number;
}

interface UserState {
  stage_id: string;
  current_streak_days: number;
  max_streak_days: number;
  total_missions_completed: number;
  last_mission_completed_date: string | null;
}

// Função para calcular o nível do selo baseado no max_streak_days
function getStreakLevel(maxStreak: number): number {
  if (maxStreak === 0) return 0;
  if (maxStreak >= 3 && maxStreak <= 6) return 1;
  if (maxStreak >= 7 && maxStreak <= 14) return 2;
  if (maxStreak >= 15 && maxStreak <= 29) return 3;
  if (maxStreak >= 30 && maxStreak <= 59) return 4;
  if (maxStreak >= 60 && maxStreak <= 89) return 5;
  if (maxStreak >= 90 && maxStreak <= 179) return 6;
  if (maxStreak >= 180 && maxStreak <= 359) return 7;
  if (maxStreak >= 360) return 8;
  return 0;
}

// Função para obter as cores do selo baseado no nível
function getStreakColors(level: number): { bg: string; text: string; border: string } {
  const colors = [
    { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", border: "border-gray-300 dark:border-gray-700" }, // Nível 0
    { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-700" }, // Nível 1
    { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-300 dark:border-cyan-700" }, // Nível 2
    { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", border: "border-green-300 dark:border-green-700" }, // Nível 3
    { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-300 dark:border-yellow-700" }, // Nível 4
    { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", border: "border-orange-300 dark:border-orange-700" }, // Nível 5
    { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400", border: "border-red-300 dark:border-red-700" }, // Nível 6
    { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400", border: "border-pink-300 dark:border-pink-700" }, // Nível 7
    { bg: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-400 dark:border-purple-600" }, // Nível 8
  ];
  return colors[level] || colors[0];
}

export function RendexProfile({ userId }: RendexProfileProps) {
  const [stage, setStage] = useState<Stage | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar user_state
        const { data: stateData, error: stateError } = await supabase
          .from("rendex_trilha_user_state")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (stateError) {
          console.error("Erro ao buscar user_state:", stateError);
          setLoading(false);
          return;
        }

        if (!stateData) {
          setLoading(false);
          return;
        }

        setUserState(stateData);

        // Buscar stage atual
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select("*")
          .eq("id", stateData.stage_id)
          .single();

        if (stageError) {
          console.error("Erro ao buscar stage:", stageError);
        } else {
          setStage(stageData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados da trilha:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A9CC6] dark:border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!userState || !stage) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 mx-auto text-[#7A9CC6] dark:text-blue-400" />
          <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400">
            Trilha RendEx
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Você ainda não iniciou a Trilha RendEx. Acesse a trilha para começar sua jornada!
          </p>
        </div>
      </div>
    );
  }

  const streakLevel = getStreakLevel(userState.max_streak_days);
  const streakColors = getStreakColors(streakLevel);

  return (
    <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
          Trilha RendEx
        </h3>
      </div>

      {/* Patente e Estágio */}
      <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/50 dark:bg-slate-700/50 p-3 rounded-xl">
            <Trophy className="w-8 h-8 text-[#7A9CC6] dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Patente Atual</p>
            <p className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400">
              {stage.patent}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Estágio: {stage.name} (Nível {stage.order_index})
            </p>
          </div>
        </div>
      </div>

      {/* Selo de Streak (SEM contador regressivo) */}
      <div className={`${streakColors.bg} border-2 ${streakColors.border} p-6 rounded-2xl`}>
        <div className="flex items-start gap-4">
          <div className={`${streakColors.bg} p-3 rounded-xl border ${streakColors.border}`}>
            <Flame className={`w-8 h-8 ${streakColors.text}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sequência de Dias</p>
            
            {/* Streak Atual */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold ${streakColors.text}`}>
                {userState.current_streak_days}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userState.current_streak_days === 1 ? "dia" : "dias"} consecutivos
              </span>
            </div>

            {/* Maior Streak */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Recorde: <span className="font-bold">{userState.max_streak_days}</span> dias
              </span>
            </div>

            {/* Nível do Selo */}
            {streakLevel > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${streakColors.bg} border-2 ${streakColors.border}`}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Selo Nível {streakLevel}/8
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 dark:from-pink-900/20 dark:to-purple-900/20 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Missões Concluídas</span>
            <span className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400">
              {userState.total_missions_completed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
