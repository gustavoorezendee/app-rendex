import { supabase } from '@/lib/supabase';

// ============================================
// TIPOS
// ============================================

export type Stage = {
  id: string;
  key: string;
  name: string;
  patent: string;
  order_index: number;
};

export type Mission = {
  id: string;
  estagio_num: number;
  dia: number;
  codigo: string;
  titulo: string;
  descricao: string;
};

export type UserTrailState = {
  id: string;
  user_id: string;
  stage_id: string;
  current_mission_day: number;
  current_streak_days: number;
  max_streak_days: number;
  total_missions_completed: number;
  last_mission_completed_at: string | null;
  last_mission_completed_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TrailState = {
  stage: {
    id: string;
    key: string;
    name: string;
    patent: string;
    order_index: number;
  };
  mission_atual: {
    dia: number;
    codigo: string;
    titulo: string;
    descricao: string;
  };
  current_streak_days: number;
  max_streak_days: number;
  total_missions_completed: number;
};

export type CompleteMissionResult = {
  success: boolean;
  message: string;
  newState?: TrailState;
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Retorna a data atual no timezone de Brasília (UTC-3) no formato YYYY-MM-DD
 */
function getTodayInBrasilia(): string {
  const now = new Date();
  // Converter para timezone de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaTime = new Date(utcTime + brasiliaOffset * 60000);
  
  const year = brasiliaTime.getFullYear();
  const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de ontem no timezone de Brasília (UTC-3) no formato YYYY-MM-DD
 */
function getYesterdayInBrasilia(): string {
  const now = new Date();
  // Converter para timezone de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaTime = new Date(utcTime + brasiliaOffset * 60000);
  
  // Subtrair 1 dia
  brasiliaTime.setDate(brasiliaTime.getDate() - 1);
  
  const year = brasiliaTime.getFullYear();
  const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Inicializa o progresso da trilha para um usuário
 * Se já existir, não faz nada. Se não existir, cria o registro inicial.
 */
export async function initializeUserTrail(userId: string): Promise<boolean> {
  try {
    // Verificar se já existe registro
    const { data: existingState, error: fetchError } = await supabase
      .from('rendex_trilha_user_state')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao verificar estado da trilha:', fetchError);
      return false;
    }

    // Se já existe, não precisa criar
    if (existingState) {
      return true;
    }

    // Buscar o primeiro estágio (order_index = 1)
    const { data: firstStage, error: stageError } = await supabase
      .from('stages')
      .select('id')
      .eq('order_index', 1)
      .single();

    if (stageError || !firstStage) {
      console.error('Erro ao buscar primeiro estágio:', stageError);
      return false;
    }

    // Criar registro inicial
    const { error: insertError } = await supabase
      .from('rendex_trilha_user_state')
      .insert({
        user_id: userId,
        stage_id: firstStage.id,
        current_mission_day: 1,
        current_streak_days: 0,
        max_streak_days: 0,
        total_missions_completed: 0,
        last_mission_completed_at: null,
        last_mission_completed_date: null,
      });

    if (insertError) {
      console.error('Erro ao criar estado inicial da trilha:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao inicializar trilha:', error);
    return false;
  }
}

/**
 * Busca o estado atual da trilha do usuário
 */
export async function getCurrentTrailState(userId: string): Promise<TrailState | null> {
  try {
    // Buscar estado do usuário
    const { data: userState, error: stateError } = await supabase
      .from('rendex_trilha_user_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stateError || !userState) {
      console.error('Erro ao buscar estado da trilha:', stateError);
      return null;
    }

    // Buscar estágio atual
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('id, key, name, patent, order_index')
      .eq('id', userState.stage_id)
      .single();

    if (stageError || !stage) {
      console.error('Erro ao buscar estágio atual:', stageError);
      return null;
    }

    // Buscar missão atual
    const { data: mission, error: missionError } = await supabase
      .from('rendex_trilha_missoes')
      .select('dia, codigo, titulo, descricao')
      .eq('estagio_num', stage.order_index)
      .eq('dia', userState.current_mission_day)
      .single();

    if (missionError || !mission) {
      console.error('Erro ao buscar missão atual:', missionError);
      return null;
    }

    return {
      stage: {
        id: stage.id,
        key: stage.key,
        name: stage.name,
        patent: stage.patent,
        order_index: stage.order_index,
      },
      mission_atual: {
        dia: mission.dia,
        codigo: mission.codigo,
        titulo: mission.titulo,
        descricao: mission.descricao,
      },
      current_streak_days: userState.current_streak_days,
      max_streak_days: userState.max_streak_days,
      total_missions_completed: userState.total_missions_completed,
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar estado da trilha:', error);
    return null;
  }
}

/**
 * Completa a missão do dia atual
 */
export async function completeTodayMission(userId: string): Promise<CompleteMissionResult> {
  try {
    const today = getTodayInBrasilia();
    const yesterday = getYesterdayInBrasilia();

    // Buscar estado atual do usuário
    const { data: userState, error: stateError } = await supabase
      .from('rendex_trilha_user_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stateError || !userState) {
      return {
        success: false,
        message: 'Estado da trilha não encontrado. Inicialize primeiro.',
      };
    }

    // Verificar se já completou missão hoje
    if (userState.last_mission_completed_date === today) {
      return {
        success: false,
        message: 'Você já completou a missão de hoje. Volte amanhã!',
      };
    }

    // Buscar estágio atual
    const { data: currentStage, error: stageError } = await supabase
      .from('stages')
      .select('*')
      .eq('id', userState.stage_id)
      .single();

    if (stageError || !currentStage) {
      return {
        success: false,
        message: 'Erro ao buscar estágio atual.',
      };
    }

    // Buscar missão atual
    const { data: currentMission, error: missionError } = await supabase
      .from('rendex_trilha_missoes')
      .select('*')
      .eq('estagio_num', currentStage.order_index)
      .eq('dia', userState.current_mission_day)
      .single();

    if (missionError || !currentMission) {
      return {
        success: false,
        message: 'Erro ao buscar missão atual.',
      };
    }

    // Inserir log de conclusão
    const { error: logError } = await supabase
      .from('rendex_trilha_mission_log')
      .insert({
        user_id: userId,
        stage_id: currentStage.id,
        estagio_num: currentStage.order_index,
        mission_day: userState.current_mission_day,
        mission_code: currentMission.codigo,
        mission_title: currentMission.titulo,
        completed_at: new Date().toISOString(),
        completed_date: today,
      });

    if (logError) {
      console.error('Erro ao inserir log de missão:', logError);
      return {
        success: false,
        message: 'Erro ao registrar conclusão da missão.',
      };
    }

    // Calcular novo streak
    let newStreakDays = 1;
    if (userState.last_mission_completed_date === yesterday) {
      newStreakDays = userState.current_streak_days + 1;
    }

    const newMaxStreak = Math.max(userState.max_streak_days, newStreakDays);

    // Calcular próxima missão e estágio
    let nextStageId = userState.stage_id;
    let nextMissionDay = userState.current_mission_day;

    if (userState.current_mission_day < 30) {
      // Avançar para próximo dia no mesmo estágio
      nextMissionDay = userState.current_mission_day + 1;
    } else {
      // Tentar avançar para próximo estágio
      const { data: nextStage, error: nextStageError } = await supabase
        .from('stages')
        .select('id')
        .eq('order_index', currentStage.order_index + 1)
        .maybeSingle();

      if (!nextStageError && nextStage) {
        // Existe próximo estágio
        nextStageId = nextStage.id;
        nextMissionDay = 1;
      }
      // Se não existe próximo estágio, mantém os valores atuais
    }

    // Atualizar estado do usuário
    const { error: updateError } = await supabase
      .from('rendex_trilha_user_state')
      .update({
        stage_id: nextStageId,
        current_mission_day: nextMissionDay,
        current_streak_days: newStreakDays,
        max_streak_days: newMaxStreak,
        total_missions_completed: userState.total_missions_completed + 1,
        last_mission_completed_at: new Date().toISOString(),
        last_mission_completed_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Erro ao atualizar estado da trilha:', updateError);
      return {
        success: false,
        message: 'Erro ao atualizar progresso.',
      };
    }

    // Buscar novo estado para retornar
    const newState = await getCurrentTrailState(userId);

    return {
      success: true,
      message: 'Missão concluída com sucesso!',
      newState: newState || undefined,
    };
  } catch (error) {
    console.error('Erro inesperado ao completar missão:', error);
    return {
      success: false,
      message: 'Erro inesperado ao completar missão.',
    };
  }
}
