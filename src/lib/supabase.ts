import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      .select('*')
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
      .select('*')
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
      .select('*')
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
      .select('*')
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
      .select('*')
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
