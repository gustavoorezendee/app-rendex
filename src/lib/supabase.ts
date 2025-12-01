import { createClient } from '@supabase/supabase-js';

// Valores padrão para evitar erros de build quando variáveis não estão configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Verificar se as variáveis estão configuradas (apenas em runtime, não durante build)
const isSupabaseConfigured = typeof window !== 'undefined' 
  ? !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : true; // Durante SSR/build, assumir que está configurado

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipo para o plano de ação premium
export type PremiumPlanoAcao = {
  versao: number;
  descricao_geral: string;
  usar_campos_da_rendex?: {
    usa_descricao_curta?: boolean;
    usa_primeiro_passo?: boolean;
    usa_teste_24h?: boolean;
    usa_passo_premium_resumo?: boolean;
  };
  primeiros_passos?: {
    titulo: string;
    descricao: string;
    acao_pratica: string;
  }[];
  plano_7_dias?: {
    dia: number;
    foco: string;
    titulo: string;
    objetivo: string;
    tarefas: string[];
  }[];
  checklist_geral?: {
    categoria: string;
    itens: string[];
  }[];
  mensagem_final?: string;
};

// Tipos para a tabela rendex_catalogo
export type RendexCatalogo = {
  id: string;
  nome: string;
  categoria: string;
  perfil_ideal: string;
  habilidade_predominante: string;
  complexidade: number;
  investimento_inicial: number;
  tempo_inicio: string;
  tipo_modelo: string;
  ganho_inicial_estimado: string;
  ganho_3meses_estimado: string;
  descricao_curta: string;
  primeiro_passo: string;
  teste_24h: string;
  passo_premium_resumo: string;
  ativo: boolean;
  premium_plano_acao?: PremiumPlanoAcao | null;
  created_at?: string;
};

// Tipos para o perfil do usuário
export type UserProfile = {
  perfil_rendex: string;
  tempo_disponivel: string;
  investimento_disponivel: number;
  urgencia_retorno: string;
  preferencia_trabalho: string;
  objetivo_mensal: string;
};

// Tipos para a tabela profiles
export type Profile = {
  user_id: string;
  plano: 'free' | 'premium';
  created_at?: string;
  updated_at?: string;
};

// Tipo para o progresso do usuário
export type UserRendexProgresso = {
  id: string;
  user_id: string;
  rendex_id: string;
  dia: number | null;
  checklist_categoria: string | null;
  checklist_item: string | null;
  concluido: boolean;
  updated_at: string;
};

// Tipo para o progresso estruturado da RendEx
export type RendexProgresso = {
  diasConcluidos: Record<number, boolean>;
  checklistConcluido: Record<string, boolean>;
};

// Tipo para o progresso do checklist (usado nas funções de checklist)
export type UserRendexChecklistProgress = {
  user_id: string;
  rendex_id: string;
  checklist_categoria: string;
  checklist_item: string;
  concluido: boolean;
};

// Tipo para o resultado do quiz salvo
export type QuizResultadoSalvo = {
  userId: string;
  perfilIdeal: string;
  rendexIds: string[];
  createdAt: string;
  updatedAt: string;
};

// Helper para verificar se Supabase está configurado
function checkSupabaseConfig(): boolean {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não está configurado. Configure as variáveis de ambiente.');
    return false;
  }
  return true;
}

// Função para buscar ou criar perfil do usuário
export async function getOrCreateUserProfile(userId: string): Promise<Profile | null> {
  if (!checkSupabaseConfig()) return null;
  
  try {
    // Tentar buscar perfil existente
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Se encontrou, retornar
    if (existingProfile && !fetchError) {
      return existingProfile;
    }

    // Se não encontrou (erro PGRST116), criar novo perfil
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          plano: 'free',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        return null;
      }

      return newProfile;
    }

    // Outro tipo de erro
    console.error('Erro ao buscar perfil:', fetchError);
    return null;
  } catch (error) {
    console.error('Erro inesperado ao buscar/criar perfil:', error);
    return null;
  }
}

// Função para atualizar o plano do usuário
export async function updateUserPlano(
  userId: string,
  novoPlano: 'free' | 'premium'
): Promise<Profile | null> {
  if (!checkSupabaseConfig()) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        plano: novoPlano,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao atualizar plano:', error);
    return null;
  }
}

// Função para buscar Rendex recomendadas baseadas no perfil do usuário
export async function buscarRendexRecomendadas(
  userProfile: UserProfile
): Promise<RendexCatalogo[]> {
  if (!checkSupabaseConfig()) return [];
  
  try {
    // Mapas de filtros
    const tempoInicioMap: Record<string, string[]> = {
      imediato: ['imediato', '1_dia'],
      rapido: ['imediato', '1_dia', '1_semana'],
      medio: ['imediato', '1_dia', '1_semana', '1_mes'],
      longo: ['imediato', '1_dia', '1_semana', '1_mes', '1_3_meses'],
    };

    const tipoModeloMap: Record<string, string[]> = {
      pessoas: ['servico', 'presencial', 'offline', 'online_presencial', 'hibrido'],
      vender: ['produto', 'vendas', 'offline_online', 'online_presencial', 'hibrido'],
      servico: ['servico', 'presencial', 'offline', 'online_presencial', 'hibrido'],
      online: ['online', 'online_presencial', 'offline_online', 'hibrido'],
    };

    const tempoInicioPermitidos = tempoInicioMap[userProfile.urgencia_retorno] || ['imediato', '1_semana', '1_mes'];
    const tiposPermitidos = tipoModeloMap[userProfile.preferencia_trabalho] || ['servico', 'produto'];

    // 1) Busca completa com todos os filtros
    let { data, error } = await supabase
      .from('rendex_catalogo')
      .select('id, nome, categoria, perfil_ideal, habilidade_predominante, complexidade, investimento_inicial, tempo_inicio, tipo_modelo, ganho_inicial_estimado, ganho_3meses_estimado, descricao_curta, primeiro_passo, teste_24h, passo_premium_resumo, ativo, premium_plano_acao, created_at')
      .eq('ativo', true)
      .eq('perfil_ideal', userProfile.perfil_rendex)
      .lte('investimento_inicial', userProfile.investimento_disponivel)
      .in('tempo_inicio', tempoInicioPermitidos)
      .in('tipo_modelo', tiposPermitidos)
      .order('complexidade', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Erro ao buscar Rendex:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data;
    }

    // 2) Fallback: SEM filtro de tipo_modelo
    ({ data, error } = await supabase
      .from('rendex_catalogo')
      .select('id, nome, categoria, perfil_ideal, habilidade_predominante, complexidade, investimento_inicial, tempo_inicio, tipo_modelo, ganho_inicial_estimado, ganho_3meses_estimado, descricao_curta, primeiro_passo, teste_24h, passo_premium_resumo, ativo, premium_plano_acao, created_at')
      .eq('ativo', true)
      .eq('perfil_ideal', userProfile.perfil_rendex)
      .lte('investimento_inicial', userProfile.investimento_disponivel)
      .in('tempo_inicio', tempoInicioPermitidos)
      .order('complexidade', { ascending: true })
      .limit(3));

    if (error) {
      console.error('Erro no fallback 2:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data;
    }

    // 3) Fallback: SEM tipo_modelo e SEM tempo_inicio
    ({ data, error } = await supabase
      .from('rendex_catalogo')
      .select('id, nome, categoria, perfil_ideal, habilidade_predominante, complexidade, investimento_inicial, tempo_inicio, tipo_modelo, ganho_inicial_estimado, ganho_3meses_estimado, descricao_curta, primeiro_passo, teste_24h, passo_premium_resumo, ativo, premium_plano_acao, created_at')
      .eq('ativo', true)
      .eq('perfil_ideal', userProfile.perfil_rendex)
      .lte('investimento_inicial', userProfile.investimento_disponivel)
      .order('complexidade', { ascending: true })
      .limit(3));

    if (error) {
      console.error('Erro no fallback 3:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data;
    }

    // 4) Fallback: Somente pelo perfil
    ({ data, error } = await supabase
      .from('rendex_catalogo')
      .select('id, nome, categoria, perfil_ideal, habilidade_predominante, complexidade, investimento_inicial, tempo_inicio, tipo_modelo, ganho_inicial_estimado, ganho_3meses_estimado, descricao_curta, primeiro_passo, teste_24h, passo_premium_resumo, ativo, premium_plano_acao, created_at')
      .eq('ativo', true)
      .eq('perfil_ideal', userProfile.perfil_rendex)
      .order('complexidade', { ascending: true })
      .order('investimento_inicial', { ascending: true })
      .limit(3));

    if (error) {
      console.error('Erro no fallback 4:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data;
    }

    // 5) Fallback final: 3 rendex quaisquer ativas
    ({ data, error } = await supabase
      .from('rendex_catalogo')
      .select('id, nome, categoria, perfil_ideal, habilidade_predominante, complexidade, investimento_inicial, tempo_inicio, tipo_modelo, ganho_inicial_estimado, ganho_3meses_estimado, descricao_curta, primeiro_passo, teste_24h, passo_premium_resumo, ativo, premium_plano_acao, created_at')
      .eq('ativo', true)
      .order('investimento_inicial', { ascending: true })
      .order('complexidade', { ascending: true })
      .limit(3));

    if (error) {
      console.error('Erro no fallback 5:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar Rendex recomendadas:', error);
    return [];
  }
}

// Função para carregar o progresso do usuário em uma RendEx
export async function carregarProgressoRendex(
  userId: string,
  rendexId: string
): Promise<UserRendexProgresso[]> {
  if (!checkSupabaseConfig()) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_rendex_progresso')
      .select('*')
      .eq('user_id', userId)
      .eq('rendex_id', rendexId);

    if (error) {
      console.error('Erro ao carregar progresso:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar progresso:', error);
    return [];
  }
}

// Função para salvar o progresso do usuário em uma RendEx
export async function salvarProgressoRendex(params: {
  userId: string;
  rendexId: string;
  tipo: 'dia' | 'tarefa_dia';
  dia?: number;
  tarefaTexto?: string;
}): Promise<boolean> {
  if (!checkSupabaseConfig()) return false;
  
  try {
    const { userId, rendexId, tipo, dia, tarefaTexto } = params;

    if (tipo === 'dia') {
      // Salvar conclusão de um dia do plano de 7 dias
      if (dia === undefined || dia === null) {
        return false;
      }

      const { error } = await supabase
        .from('user_rendex_progresso')
        .upsert(
          {
            user_id: userId,
            rendex_id: rendexId,
            dia: dia,
            checklist_categoria: null,
            checklist_item: null,
            concluido: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,rendex_id,dia',
          }
        );

      if (error) {
        console.error('Erro ao salvar progresso do dia:', error);
        return false;
      }

      return true;
    }

    if (tipo === 'tarefa_dia') {
      // Salvar conclusão de uma tarefa específica de um dia
      if (dia === undefined || dia === null || !tarefaTexto) {
        return false;
      }

      const { error } = await supabase
        .from('user_rendex_progresso')
        .upsert(
          {
            user_id: userId,
            rendex_id: rendexId,
            dia: dia,
            checklist_categoria: `dia_${dia}`,
            checklist_item: tarefaTexto,
            concluido: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,rendex_id,dia,checklist_categoria,checklist_item',
          }
        );

      if (error) {
        console.error('Erro ao salvar progresso da tarefa:', error);
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro inesperado ao salvar progresso:', error);
    return false;
  }
}

// Lista o progresso de checklist do usuário para uma RendEx específica
export async function listarProgressoRendex(
  userId: string,
  rendexId: string
): Promise<UserRendexChecklistProgress[]> {
  if (!checkSupabaseConfig()) return [];
  
  const { data, error } = await supabase
    .from('user_rendex_progresso')
    .select('user_id, rendex_id, checklist_categoria, checklist_item, concluido')
    .eq('user_id', userId)
    .eq('rendex_id', rendexId)
    .not('checklist_categoria', 'is', null)
    .not('checklist_item', 'is', null);

  if (error) {
    console.error('Erro ao listar progresso da RendEx:', error);
    return [];
  }

  return data ?? [];
}

// Função para alternar o status de conclusão de um dia do plano
export async function alternarDiaPlano(
  userId: string,
  rendexId: string,
  dia: number
): Promise<boolean> {
  if (!checkSupabaseConfig()) return false;
  
  try {
    // Primeiro, buscar o registro existente
    const { data: registroExistente, error: fetchError } = await supabase
      .from('user_rendex_progresso')
      .select('concluido')
      .eq('user_id', userId)
      .eq('rendex_id', rendexId)
      .eq('dia', dia)
      .is('checklist_categoria', null)
      .is('checklist_item', null)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao buscar registro existente:', fetchError);
      return false;
    }

    // Determinar o novo valor de concluido
    const novoConcluido = registroExistente ? !registroExistente.concluido : true;

    // Fazer upsert com o novo valor
    const { error: upsertError } = await supabase
      .from('user_rendex_progresso')
      .upsert(
        {
          user_id: userId,
          rendex_id: rendexId,
          dia: dia,
          checklist_categoria: null,
          checklist_item: null,
          concluido: novoConcluido,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,rendex_id,dia',
        }
      );

    if (upsertError) {
      console.error('Erro ao alternar dia do plano:', upsertError);
      return false;
    }

    return novoConcluido;
  } catch (error) {
    console.error('Erro inesperado ao alternar dia do plano:', error);
    return false;
  }
}

// Alterna o status concluído/não concluído de um item do checklist
export async function alternarChecklistItem(
  userId: string,
  rendexId: string,
  categoria: string,
  item: string
): Promise<boolean> {
  if (!checkSupabaseConfig()) return false;
  
  // Validação de parâmetros obrigatórios
  if (!userId || !rendexId || !categoria || !item) {
    console.warn('alternarChecklistItem: parâmetros obrigatórios faltando', {
      userId: !!userId,
      rendexId: !!rendexId,
      categoria: !!categoria,
      item: !!item
    });
    return false;
  }

  try {
    // Procura se já existe um registro para este item
    const { data: existente, error: selectError } = await supabase
      .from('user_rendex_progresso')
      .select('id, concluido')
      .eq('user_id', userId)
      .eq('rendex_id', rendexId)
      .eq('checklist_categoria', categoria)
      .eq('checklist_item', item)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = nenhum registro encontrado, que é ok
      console.error('Erro ao buscar item do checklist:', selectError?.message || selectError);
      return false;
    }

    const novoStatus = existente ? !existente.concluido : true;

    const payload = {
      user_id: userId,
      rendex_id: rendexId,
      dia: null,
      checklist_categoria: categoria,
      checklist_item: item,
      concluido: novoStatus,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('user_rendex_progresso')
      .upsert(payload, {
        onConflict: 'user_id,rendex_id,checklist_categoria,checklist_item',
      });

    if (upsertError) {
      console.error('Erro ao alternar item do checklist:', upsertError?.message || upsertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao alternar item do checklist:', error);
    return false;
  }
}

// ============================================
// FUNÇÕES PARA RESULTADO DO QUIZ
// ============================================

/**
 * Salva ou atualiza o resultado do quiz do usuário
 */
export async function salvarResultadoQuiz(params: {
  userId: string;
  perfilIdeal: string;
  rendexIds: string[];
}): Promise<boolean> {
  if (!checkSupabaseConfig()) return false;
  
  const { userId, perfilIdeal, rendexIds } = params;

  if (!userId || !perfilIdeal || !rendexIds || rendexIds.length === 0) {
    console.warn('salvarResultadoQuiz: parâmetros obrigatórios faltando');
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_quiz_result')
      .upsert(
        {
          user_id: userId,
          perfil_ideal: perfilIdeal,
          rendex_ids: rendexIds,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Erro ao salvar resultado do quiz:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar resultado do quiz:', error);
    return false;
  }
}

/**
 * Busca o resultado do quiz salvo do usuário
 */
export async function buscarResultadoQuiz(userId: string): Promise<QuizResultadoSalvo | null> {
  if (!checkSupabaseConfig()) return null;
  
  if (!userId) {
    console.warn('buscarResultadoQuiz: userId é obrigatório');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_quiz_result')
      .select('user_id, perfil_ideal, rendex_ids, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum resultado encontrado - isso é normal
        return null;
      }
      console.error('Erro ao buscar resultado do quiz:', error.message || error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      perfilIdeal: data.perfil_ideal,
      rendexIds: data.rendex_ids,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Erro ao buscar resultado do quiz:', error);
    return null;
  }
}

/**
 * Busca as RendEx do resultado do quiz, na ordem salva
 */
export async function buscarRendexDoResultadoQuiz(userId: string): Promise<RendexCatalogo[] | null> {
  if (!checkSupabaseConfig()) return null;
  
  if (!userId) {
    console.warn('buscarRendexDoResultadoQuiz: userId é obrigatório');
    return null;
  }

  try {
    // Primeiro, buscar o resultado do quiz
    const resultado = await buscarResultadoQuiz(userId);
    
    if (!resultado || !resultado.rendexIds || resultado.rendexIds.length === 0) {
      return null;
    }

    // Buscar as RendEx correspondentes
    const { data, error } = await supabase
      .from('rendex_catalogo')
      .select('*')
      .in('id', resultado.rendexIds);

    if (error) {
      console.error('Erro ao buscar RendEx do resultado:', error.message || error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Reordenar as RendEx na mesma ordem dos IDs salvos
    const rendexOrdenadas = resultado.rendexIds
      .map(id => data.find(r => r.id === id))
      .filter((r): r is RendexCatalogo => r !== undefined);

    return rendexOrdenadas;
  } catch (error) {
    console.error('Erro ao buscar RendEx do resultado do quiz:', error);
    return null;
  }
}

/**
 * Limpa o resultado do quiz do usuário
 */
export async function limparResultadoQuiz(userId: string): Promise<boolean> {
  if (!checkSupabaseConfig()) return false;
  
  if (!userId) {
    console.warn('limparResultadoQuiz: userId é obrigatório');
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_quiz_result')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao limpar resultado do quiz:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar resultado do quiz:', error);
    return false;
  }
}

// ============================================
// FUNÇÕES PARA SUPORTE E FEEDBACK
// ============================================
// MOVIDAS PARA src/server/supportActions.ts (server-side only)
