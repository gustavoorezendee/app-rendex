"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  initializeUserTrail, 
  getCurrentTrailState, 
  completeTodayMission,
  type TrailState,
  type Mission
} from "@/services/trailService";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle2, 
  Lock, 
  Circle, 
  Trophy, 
  Flame,
  ChevronLeft,
  Loader2,
  Clock,
  Sparkles,
  Award,
  Settings,
  Info,
  Calendar,
  AlertCircle,
  HelpCircle,
  Target,
  TrendingUp,
  Zap,
  Rocket,
  Star,
  Crown
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MissionStatus = "completed" | "available" | "locked";

type MissionDisplay = {
  dia: number;
  titulo: string;
  descricao: string;
  status: MissionStatus;
};

// Função para calcular tempo restante até meia-noite de Brasília
function getTimeUntilMidnightBrasilia(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  
  // Converter para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaTime = new Date(utcTime + brasiliaOffset * 60000);
  
  // Calcular meia-noite de Brasília
  const midnightBrasilia = new Date(brasiliaTime);
  midnightBrasilia.setHours(24, 0, 0, 0);
  
  const diff = midnightBrasilia.getTime() - brasiliaTime.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

export default function TrilhaPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [trailState, setTrailState] = useState<TrailState | null>(null);
  const [missions, setMissions] = useState<MissionDisplay[]>([]);
  const [completingMission, setCompletingMission] = useState(false);
  const [todayMissionCompleted, setTodayMissionCompleted] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [streakPulse, setStreakPulse] = useState(false);
  const [missionFlash, setMissionFlash] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [lockedMissionDay, setLockedMissionDay] = useState<number | null>(null);
  const [previousStreak, setPreviousStreak] = useState<number | null>(null);
  const [bypassRules, setBypassRules] = useState(false);

  // Carregar dados da trilha
  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/trilha");
      return;
    }

    loadTrailData();
  }, [user, router]);

  // Atualizar contador regressivo a cada segundo
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getTimeUntilMidnightBrasilia());
    };

    updateCountdown(); // Atualizar imediatamente
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Detectar aumento de streak e animar
  useEffect(() => {
    if (trailState && previousStreak !== null && trailState.current_streak_days > previousStreak) {
      setStreakPulse(true);
      setTimeout(() => setStreakPulse(false), 600);
    }
    if (trailState) {
      setPreviousStreak(trailState.current_streak_days);
    }
  }, [trailState?.current_streak_days]);

  const loadTrailData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Inicializar trilha se necessário
      await initializeUserTrail(user.id);

      // Buscar estado atual
      const state = await getCurrentTrailState(user.id);
      
      if (!state) {
        console.error("Erro ao carregar estado da trilha");
        setLoading(false);
        return;
      }

      setTrailState(state);

      // Buscar todas as missões do estágio atual
      const { data: missionsData, error } = await supabase
        .from("rendex_trilha_missoes")
        .select("dia, codigo, titulo, descricao")
        .eq("estagio_num", state.stage.order_index)
        .order("dia", { ascending: true });

      if (error || !missionsData) {
        console.error("Erro ao buscar missões:", error);
        setLoading(false);
        return;
      }

      // Verificar se a missão de hoje já foi concluída
      const { data: todayLog, error: logError } = await supabase
        .from("rendex_trilha_mission_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("stage_id", state.stage.id)
        .eq("mission_day", state.mission_atual.dia)
        .maybeSingle();

      if (!logError && todayLog) {
        setTodayMissionCompleted(true);
      }

      // Montar lista de missões com status
      const missionsDisplay: MissionDisplay[] = missionsData.map((mission) => {
        let status: MissionStatus;

        if (mission.dia < state.mission_atual.dia) {
          status = "completed";
        } else if (mission.dia === state.mission_atual.dia) {
          status = "available";
        } else {
          status = "locked";
        }

        return {
          dia: mission.dia,
          titulo: mission.titulo,
          descricao: mission.descricao,
          status,
        };
      });

      setMissions(missionsDisplay);
    } catch (error) {
      console.error("Erro ao carregar dados da trilha:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async () => {
    if (!user || completingMission) return;

    // Se bypass está ativo, ignorar verificação de missão já concluída
    if (!bypassRules && todayMissionCompleted) {
      return;
    }

    setCompletingMission(true);

    try {
      const result = await completeTodayMission(user.id);

      if (result.success) {
        // Animar card com flash verde
        setMissionFlash(true);
        setTimeout(() => setMissionFlash(false), 1000);
        
        // Mostrar feedback de sucesso
        alert("🎉 " + result.message);
        
        // Recarregar dados
        await loadTrailData();
      } else {
        // Mostrar mensagem de erro
        alert(result.message);
      }
    } catch (error) {
      console.error("Erro ao completar missão:", error);
      alert("Erro ao completar missão. Tente novamente.");
    } finally {
      setCompletingMission(false);
    }
  };

  const handleLockedMissionClick = (dia: number) => {
    setLockedMissionDay(dia);
    setShowLockedModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Carregando sua trilha...</p>
        </div>
      </div>
    );
  }

  if (!trailState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Erro ao carregar trilha</p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Botão de Ajuda */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
                title="Ajuda sobre a Trilha RendEx"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Ajuda</span>
              </button>

              {/* Botão de bypass de regras (para testes) */}
              <button
                onClick={() => setBypassRules(!bypassRules)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  bypassRules
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
                title="Ativar/desativar regras de conclusão (para testes de UI/UX)"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {bypassRules ? "Regras: OFF" : "Regras: ON"}
                </span>
              </button>
            </div>
          </div>

          {/* Card do Estágio Atual */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 dark:border-gray-700/40">
            {/* 1. Estágio Atual */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {trailState.stage.name}
                  </h1>
                </div>
                
                {/* 2. Patente Atual */}
                <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-6">
                  Patente: {trailState.stage.patent}
                </p>
              </div>
            </div>

            {/* 3. Streak Atual + Melhor Streak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Streak Atual</span>
                </div>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300 ${streakPulse ? 'animate-pulse-once scale-125' : ''}`}>
                  {trailState.current_streak_days} dias
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Melhor Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {trailState.max_streak_days} dias
                </p>
              </div>
            </div>

            {/* 4. Contador regressivo DESTACADO */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-5 mb-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-white/90 text-sm font-medium">
                      Próxima missão disponível em:
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                  <span className="font-mono font-bold text-2xl sm:text-3xl text-white">
                    {String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-white/80 text-xs">
                <Info className="w-4 h-4" />
                <span>As missões são liberadas diariamente às 00:00 (horário de Brasília)</span>
              </div>
            </div>

            {/* 5. Total de missões concluídas */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total de Missões Concluídas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trailState.total_missions_completed}
              </p>
            </div>
          </div>
        </div>

        {/* 6. Card da missão atual (destacado com melhorias) */}
        {missions.find(m => m.status === "available") && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Missão de Hoje
            </h2>
            {missions
              .filter(m => m.status === "available")
              .map((mission) => (
                <div
                  key={mission.dia}
                  className={`relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-6 shadow-2xl border-2 border-blue-400 dark:border-blue-600 ring-4 ring-blue-200/50 dark:ring-blue-800/50 overflow-hidden transition-all duration-500 ${missionFlash ? 'flash-green' : ''}`}
                  style={{
                    animation: 'pulse-glow 3s ease-in-out infinite'
                  }}
                >
                  {/* Selo "Missão do dia" no topo */}
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-bl-2xl rounded-tr-xl shadow-lg flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Missão do dia</span>
                  </div>

                  {/* Brilho sutil de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl blur-xl opacity-50"></div>

                  <div className="relative flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="relative">
                        <Circle className="w-8 h-8 text-blue-500 animate-pulse" />
                        <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                      </div>
                    </div>

                    <div className="flex-1">
                      {/* Microtexto motivacional */}
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Seu próximo passo de evolução
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          Dia {mission.dia}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {mission.titulo}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-5">
                        {mission.descricao}
                      </p>

                      <button
                        onClick={handleCompleteMission}
                        disabled={completingMission || (!bypassRules && todayMissionCompleted)}
                        className={`
                          w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base
                          transition-all duration-300 flex items-center justify-center gap-2
                          ${
                            (!bypassRules && todayMissionCompleted)
                              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 hover:-translate-y-1 ring-2 ring-blue-400/50"
                          }
                        `}
                      >
                        {completingMission ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Concluindo...</span>
                          </>
                        ) : (!bypassRules && todayMissionCompleted) ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Missão já concluída hoje</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Concluir missão de hoje</span>
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 7. Lista das missões (30 dias) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Todas as Missões ({missions.length} dias)
          </h2>

          {missions.map((mission) => (
            <div
              key={mission.dia}
              onClick={() => mission.status === "locked" && handleLockedMissionClick(mission.dia)}
              className={`
                relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border transition-all duration-300
                ${
                  mission.status === "completed"
                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                    : mission.status === "available"
                    ? "border-blue-300 dark:border-blue-700 opacity-50"
                    : "border-gray-200 dark:border-gray-700 opacity-40 cursor-pointer hover:opacity-60 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl"
                }
              `}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Ícone de status */}
                <div className="flex-shrink-0 mt-1">
                  {mission.status === "completed" && (
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  )}
                  {mission.status === "available" && (
                    <Circle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                  )}
                  {mission.status === "locked" && (
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-600" />
                  )}
                </div>

                {/* Conteúdo da missão */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Dia {mission.dia}
                    </span>
                  </div>

                  {/* Título e descrição (apenas para concluídas) */}
                  {mission.status === "completed" && (
                    <>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {mission.titulo}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                        {mission.descricao}
                      </p>
                    </>
                  )}

                  {/* Missão bloqueada */}
                  {mission.status === "locked" && (
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Missão bloqueada
                      </p>
                      <p className="text-sm mt-1">Clique para ver quando será liberada</p>
                    </div>
                  )}

                  {/* Missão disponível (não mostrar aqui, já está no card destacado) */}
                  {mission.status === "available" && (
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        Veja o card destacado acima
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal informativo para missões bloqueadas */}
      <Dialog open={showLockedModal} onOpenChange={setShowLockedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Missão ainda não disponível
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Esta missão ainda está bloqueada. As missões são liberadas diariamente, uma por dia.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Complete a missão de hoje para desbloquear a próxima amanhã</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Próxima missão disponível em:
                </p>
                <div className="flex justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-3 shadow-md">
                    <span className="font-mono font-bold text-3xl text-blue-600 dark:text-blue-400">
                      {String(countdown.hours).padStart(2, '0')}:
                      {String(countdown.minutes).padStart(2, '0')}:
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  Horário de Brasília (UTC-3)
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica:</strong> Mantenha seu streak ativo completando missões todos os dias! Quanto maior seu streak, mais você evolui na trilha RendEx.
                  </span>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Modal de Ajuda - REESCRITO COM CONTEÚDO OFICIAL */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Guia Oficial da Trilha RendEx 360°
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* O que é a Trilha RendEx */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                    O que é a Trilha RendEx?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    A Trilha RendEx 360° é uma jornada de <strong>360 dias</strong> criada para transformar qualquer pessoa em um profissional capaz de gerar renda de forma estruturada, disciplinada e crescente.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    Ela não ensina apenas "finanças".<br />
                    Ela desenvolve:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Clareza</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Foco</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Execução</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Organização</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Mentalidade forte</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Habilidades práticas</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Disciplina diária</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Visão de negócio</span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                    A cada dia, você realiza uma missão simples, mas extremamente poderosa.<br />
                    O progresso é acumulado e visível.
                  </p>
                </div>
              </div>
            </div>

            {/* Como a trilha funciona */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                    Como a trilha funciona?
                  </h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>12 estágios evolutivos</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>30 missões por estágio</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>Apenas 1 missão liberada por dia</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>Próxima missão só abre no dia seguinte</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>Missões futuras ficam bloqueadas</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>A cada estágio, sua patente evolui</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 font-bold">✔</span>
                      <span><strong>No final, você completa os 360 dias e se torna 360°</strong></span>
                    </li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 font-semibold">
                    A trilha foi criada para garantir resultado real, mesmo que você tenha pouco tempo.
                  </p>
                </div>
              </div>
            </div>

            {/* Sistema de Patentes */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-yellow-500 rounded-full p-2 flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                    Sistema de Patentes RendEx
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Cada estágio desbloqueia uma nova patente, que representa sua evolução real na jornada:
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: "Iniciante 360°", desc: "Fundação", icon: "🌱" },
                      { name: "Explorador 360°", desc: "Direção", icon: "🧭" },
                      { name: "Tático 360°", desc: "Execução Inicial", icon: "🎯" },
                      { name: "Executor 360°", desc: "Renda na Prática", icon: "⚡" },
                      { name: "Profissional 360°", desc: "Otimização", icon: "💼" },
                      { name: "Especialista 360°", desc: "Consolidação", icon: "🎓" },
                      { name: "Estrategista 360°", desc: "Multiplicação", icon: "♟️" },
                      { name: "Mentor 360°", desc: "Liderança", icon: "🤝" },
                      { name: "Mestre 360°", desc: "Alta Performance", icon: "🏆" },
                      { name: "Empresário 360°", desc: "Estruturação", icon: "🏢" },
                      { name: "Criador 360°", desc: "Expansão", icon: "🚀" },
                      { name: "Lendário 360°", desc: "Domínio Total", icon: "👑" },
                    ].map((patent, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                        <span className="text-2xl">{patent.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{patent.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{patent.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-4 font-semibold">
                    Sua patente sempre aparece no seu perfil e nos estágios da trilha.
                  </p>
                </div>
              </div>
            </div>

            {/* O que é o Streak */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                    O que é o Streak RendEx?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    O Streak é sua sequência de dias consecutivos concluindo missões da trilha.<br />
                    Ele mede <strong>disciplina, consistência e compromisso</strong> com sua evolução.
                  </p>
                  
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Como funciona o Streak:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>Ao concluir uma missão, inicia-se um contador regressivo de 24 horas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>Se você não fizer a próxima missão dentro desse tempo, seu streak zera.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>A missão do dia só destrava quando virar o dia (00:00 – horário de Brasília).</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Como manter seu streak alto:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1 font-bold">✓</span>
                        <span>Abra a trilha todo dia</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1 font-bold">✓</span>
                        <span>Conclua a missão liberada</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1 font-bold">✓</span>
                        <span>Use o horário do dia que funciona melhor para você</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1 font-bold">✓</span>
                        <span>Observe o contador regressivo</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
                    <p className="text-red-700 dark:text-red-300 font-bold flex items-start gap-2">
                      <span className="text-xl">⚠</span>
                      <span>Aviso importante: Se você pular um dia, a missão seguinte continua presa e seu streak volta para zero.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Por que funciona */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-purple-500 rounded-full p-2 flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                    Por que a Trilha RendEx funciona?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    Porque ela combina:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Microexecução diária</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Foco absoluto (Modo REX)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Bloqueio de distrações</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Progressão psicológica</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Estrutura profissional</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Construção real de habilidades</span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 font-semibold text-center">
                    Você não apenas aprende.<br />
                    Você evolui, praticando.
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagem final */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-2xl">
              <div className="flex items-start gap-3">
                <Sparkles className="w-7 h-7 flex-shrink-0 mt-1 animate-pulse" />
                <div>
                  <h3 className="font-bold text-xl mb-3">Mensagem Final</h3>
                  <p className="leading-relaxed mb-3">
                    Avançar na Trilha RendEx é caminhar rumo ao seu negócio, renda extra ou habilidade profissional.
                  </p>
                  <p className="leading-relaxed mb-3 font-semibold text-lg">
                    O segredo não é velocidade.<br />
                    É consistência.
                  </p>
                  <p className="leading-relaxed font-bold text-xl text-yellow-300">
                    Pequenos passos diários constroem um futuro extraordinário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(99, 102, 241, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(99, 102, 241, 0.3);
          }
        }

        @keyframes pulse-once {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-pulse-once {
          animation: pulse-once 0.6s ease-in-out;
        }

        .flash-green {
          animation: flash-green 0.5s ease-in-out 2;
        }

        @keyframes flash-green {
          0%, 100% {
            background: linear-gradient(to bottom right, rgb(239 246 255), rgb(224 231 255), rgb(243 232 255));
          }
          50% {
            background: linear-gradient(to bottom right, rgb(220 252 231), rgb(187 247 208), rgb(134 239 172));
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
          }
        }

        @media (prefers-color-scheme: dark) {
          .flash-green {
            animation: flash-green-dark 0.5s ease-in-out 2;
          }

          @keyframes flash-green-dark {
            0%, 100% {
              background: linear-gradient(to bottom right, rgb(30 58 138 / 0.3), rgb(67 56 202 / 0.3), rgb(107 33 168 / 0.3));
            }
            50% {
              background: linear-gradient(to bottom right, rgb(20 83 45 / 0.5), rgb(21 128 61 / 0.5), rgb(22 163 74 / 0.5));
              box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
            }
          }
        }
      `}</style>
    </div>
  );
}
