"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface JornadaRendExProps {
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

export function JornadaRendEx({ userId }: JornadaRendExProps) {
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
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!userState || !stage) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-12">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 mx-auto text-purple-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Trilha RendEx
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Você ainda não iniciou a Trilha RendEx. Acesse a trilha para começar sua jornada!
          </p>
          <Link
            href="/trilha"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Iniciar Trilha RendEx
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl mb-12">
      {/* Título da seção */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Sua Jornada RendEx
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe seu progresso na trilha de 360 dias
        </p>
      </div>

      {/* Grid de cards compactos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1 - Patente Atual */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Patente Atual
            </h3>
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {stage.patent}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {stage.name} • Nível {stage.order_index}
          </p>
        </div>

        {/* Card 2 - Sequência de Dias (Streak) */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Sequência de Dias
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-orange-500">
              {userState.current_streak_days}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {userState.current_streak_days === 1 ? "dia" : "dias"}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Recorde: <span className="font-bold">{userState.max_streak_days}</span> dias
          </p>
        </div>

        {/* Card 3 - Missões Concluídas */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-5 border-2 border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Missões Concluídas
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {userState.total_missions_completed}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Continue assim! 🚀
          </p>
        </div>
      </div>

      {/* Botão grande para acessar a trilha */}
      <Link
        href="/trilha"
        className="block w-full py-4 px-6 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
      >
        <span className="flex items-center justify-center gap-2">
          Acessar Trilha RendEx
          <ArrowRight className="w-6 h-6" />
        </span>
      </Link>
    </div>
  );
}
