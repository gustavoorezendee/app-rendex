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
    // Construir query com filtros baseados no perfil
    let query = supabase
      .from('rendex_catalogo')
      .select('*')
      .eq('ativo', true)
      .eq('perfil_ideal', userProfile.perfil_rendex)
      .lte('investimento_inicial', userProfile.investimento_disponivel);

    // Filtrar por tempo de início baseado na urgência
    const tempoInicioMap: Record<string, string[]> = {
      imediato: ['imediato'],
      rapido: ['imediato', '1_semana'],
      medio: ['imediato', '1_semana', '1_mes'],
      longo: ['imediato', '1_semana', '1_mes', '3_meses_mais'],
    };

    const temposPermitidos = tempoInicioMap[userProfile.urgencia_retorno] || [
      'imediato',
      '1_semana',
      '1_mes',
    ];
    query = query.in('tempo_inicio', temposPermitidos);

    // Filtrar por tipo de modelo baseado na preferência de trabalho
    const tipoModeloMap: Record<string, string[]> = {
      pessoas: ['servico', 'presencial', 'hibrido'],
      vender: ['produto', 'hibrido'],
      servico: ['servico', 'presencial', 'hibrido'],
      online: ['online', 'digital', 'hibrido'],
    };

    const tiposPermitidos = tipoModeloMap[userProfile.preferencia_trabalho] || [
      'servico',
      'produto',
    ];
    query = query.in('tipo_modelo', tiposPermitidos);

    // Ordenar por complexidade (mais simples primeiro) e limitar a 3
    const { data, error } = await query.order('complexidade', { ascending: true }).limit(3);

    if (error) {
      console.error('Erro ao buscar Rendex:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar Rendex recomendadas:', error);
    return [];
  }
}
