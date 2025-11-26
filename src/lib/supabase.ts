import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

// Função para buscar ou criar perfil do usuário
export async function getOrCreateUserProfile(userId: string): Promise<Profile | null> {
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

// Função para listar o progresso estruturado do usuário em uma RendEx
export async function listarProgressoRendex(
  userId: string,
  rendexId: string
): Promise<RendexProgresso> {
  try {
    const { data, error } = await supabase
      .from('user_rendex_progresso')
      .select('*')
      .eq('user_id', userId)
      .eq('rendex_id', rendexId);

    if (error) {
      console.error('Erro ao listar progresso:', error);
      return {
        diasConcluidos: {},
        checklistConcluido: {},
      };
    }

    const diasConcluidos: Record<number, boolean> = {};
    const checklistConcluido: Record<string, boolean> = {};

    if (data) {
      for (const registro of data) {
        // Progresso de dias (quando dia está preenchido e checklist_item está vazio)
        if (registro.dia !== null && !registro.checklist_item) {
          diasConcluidos[registro.dia] = registro.concluido;
        }

        // Progresso de checklist (quando categoria e item estão preenchidos)
        if (registro.checklist_categoria && registro.checklist_item) {
          const chave = `${registro.checklist_categoria}::${registro.checklist_item}`;
          checklistConcluido[chave] = registro.concluido;
        }
      }
    }

    return {
      diasConcluidos,
      checklistConcluido,
    };
  } catch (error) {
    console.error('Erro inesperado ao listar progresso:', error);
    return {
      diasConcluidos: {},
      checklistConcluido: {},
    };
  }
}

// Função para alternar o status de conclusão de um dia do plano
export async function alternarDiaPlano(
  userId: string,
  rendexId: string,
  dia: number
): Promise<boolean> {
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

// Função para alternar o status de conclusão de um item do checklist
export async function alternarChecklistItem(
  userId: string,
  rendexId: string,
  categoria: string,
  item: string
): Promise<boolean> {
  try {
    // Primeiro, buscar o registro existente
    const { data: registroExistente, error: fetchError } = await supabase
      .from('user_rendex_progresso')
      .select('concluido')
      .eq('user_id', userId)
      .eq('rendex_id', rendexId)
      .eq('checklist_categoria', categoria)
      .eq('checklist_item', item)
      .is('dia', null)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar registro existente:', fetchError.message || fetchError);
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
          dia: null,
          checklist_categoria: categoria,
          checklist_item: item,
          concluido: novoConcluido,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,rendex_id,checklist_categoria,checklist_item',
        }
      );

    if (upsertError) {
      console.error('Erro ao alternar item do checklist:', upsertError.message || upsertError);
      return false;
    }

    return novoConcluido;
  } catch (error) {
    console.error('Erro inesperado ao alternar item do checklist:', error);
    return false;
  }
}
