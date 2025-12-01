// Configuração centralizada dos perfis do quiz
// Cada perfil tem informações completas sobre travas e motivações

export type ProfileType = "executor" | "social" | "estrategista" | "digital";

export interface ProfileConfig {
  type: ProfileType;
  title: string;
  baseDescription: string;
  strengths: string[];
  finalMessage: string;
}

// Mapeamento de travas com títulos e descrições personalizadas
export const TRAVAS_CONFIG: Record<string, { titulo: string; descricao: string }> = {
  tempo: {
    titulo: "falta de tempo",
    descricao: "Eu sei que sua rotina é corrida e parece que não sobra espaço para mais nada. Mas isso não significa que você não possa começar. Existem opções de Rendex que se encaixam em pequenos intervalos do seu dia, sem exigir horas seguidas de dedicação. O segredo está em escolher algo que funcione com o tempo que você tem, não contra ele.",
  },
  dinheiro: {
    titulo: "investimento inicial limitado",
    descricao: "Começar sem dinheiro pode parecer impossível, mas não é. Muitas pessoas constroem suas primeiras rendas extras com zero ou quase zero de investimento. O que você precisa é de uma direção clara e de opções que valorizem suas habilidades, não o tamanho da sua conta bancária. E isso existe.",
  },
  conhecimento: {
    titulo: "não saber por onde começar",
    descricao: "A sensação de estar perdido é uma das mais comuns quando pensamos em começar algo novo. Mas isso não é falta de capacidade, é apenas falta de um mapa. Você não precisa saber tudo antes de começar. Precisa apenas de um primeiro passo claro, e é exatamente isso que vamos te dar.",
  },
  medo: {
    titulo: "medo de não dar certo",
    descricao: "O medo de falhar é natural, e mostra que você se importa com o resultado. Mas deixar o medo decidir por você é abrir mão de oportunidades reais. A boa notícia é que existem formas de começar com baixo risco, testando aos poucos, sem colocar tudo em jogo. Você não precisa de coragem cega, precisa de um caminho seguro.",
  },
};

// Mapeamento de motivações com títulos e descrições personalizadas
export const MOTIVACOES_CONFIG: Record<string, { titulo: string; descricao: string }> = {
  dinheiro: {
    titulo: "aumentar sua renda mensal",
    descricao: "Você quer mais dinheiro no final do mês, e isso é completamente legítimo. Não é sobre luxo, é sobre respirar melhor, ter mais margem, conseguir pagar as contas sem aperto. Esse objetivo é claro, direto e alcançável. E quando você encontra a Rendex certa, o dinheiro começa a entrar de forma consistente.",
  },
  independencia: {
    titulo: "conquistar independência financeira",
    descricao: "Você não quer apenas ganhar mais, você quer depender menos. Quer ter a sensação de que está no controle da sua vida financeira, que não precisa pedir permissão ou esperar por ninguém. Essa busca por autonomia é poderosa, e construir uma renda extra é um dos passos mais concretos para chegar lá.",
  },
  proposito: {
    titulo: "trabalhar com propósito e significado",
    descricao: "Para você, não é só sobre o dinheiro. É sobre fazer algo que tenha sentido, que te faça sentir útil, que traga realização. Você quer acordar sabendo que está construindo algo que importa, mesmo que seja pequeno. E quando você encontra uma Rendex alinhada com seus valores, o trabalho deixa de ser peso e vira motivação.",
  },
  liberdade: {
    titulo: "ter mais liberdade e flexibilidade",
    descricao: "Você valoriza a liberdade acima de quase tudo. Quer poder escolher seus horários, trabalhar de onde quiser, não ficar preso a uma rotina rígida. Essa busca por flexibilidade não é preguiça, é uma forma inteligente de viver. E existem tipos de Rendex que te dão exatamente isso: autonomia total sobre o seu tempo.",
  },
};

// Configuração completa dos perfis
export const PROFILES_CONFIG: Record<string, ProfileConfig> = {
  "Executor Prático": {
    type: "executor",
    title: "Executor Prático",
    baseDescription: "Você é do tipo que gosta de colocar a mão na massa e ver resultado rápido. Não perde tempo com teorias complicadas, prefere o que é direto, funcional e tangível. Quando decide fazer algo, vai até o fim. Você valoriza a simplicidade e tem facilidade para transformar ideias em ação. Pessoas como você constroem coisas reais, com consistência e determinação.",
    strengths: [
      "Você tem facilidade para executar e finalizar tarefas",
      "Prefere o que é prático e traz resultados visíveis",
      "Tem habilidade manual ou criativa que pode ser monetizada",
    ],
    finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que combinam perfeitamente com o seu jeito de trabalhar. São opções práticas, diretas e que valorizam sua capacidade de executar. Vamos te mostrar agora quais são as melhores para você começar.",
  },
  "Social Comunicador": {
    type: "social",
    title: "Social Comunicador",
    baseDescription: "Você se conecta bem com pessoas. Tem facilidade para conversar, criar vínculos e fazer os outros se sentirem à vontade. Gosta de ajudar, de estar presente, de fazer diferença na vida de quem está ao seu redor. Você não vê trabalho apenas como tarefa, vê como oportunidade de construir relacionamentos. E isso é um talento raro e valioso.",
    strengths: [
      "Você tem facilidade natural para se comunicar e criar conexões",
      "Gosta de trabalhar com pessoas e ajudar os outros",
      "Tem empatia e sabe ouvir, o que gera confiança",
    ],
    finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que valorizam exatamente o que você tem de melhor: sua capacidade de se conectar com pessoas. São opções onde sua comunicação e empatia se transformam em renda. Vamos te mostrar quais são.",
  },
  "Estratégico Analítico": {
    type: "estrategista",
    title: "Estrategista Organizado",
    baseDescription: "Você gosta de planejar, estruturar e ter controle sobre o que está fazendo. Não age por impulso, prefere entender o cenário antes de tomar decisões. Tem atenção aos detalhes e valoriza a segurança. Pessoas como você constroem bases sólidas, evitam erros desnecessários e sabem que consistência vale mais que velocidade.",
    strengths: [
      "Você tem habilidade para organizar, planejar e estruturar processos",
      "Presta atenção aos detalhes e evita decisões impulsivas",
      "Valoriza segurança e previsibilidade, o que reduz riscos",
    ],
    finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que combinam com seu perfil organizado e estratégico. São opções que permitem planejamento, controle e crescimento sustentável. Vamos te mostrar quais são as melhores para você.",
  },
  "Digital Independente": {
    type: "digital",
    title: "Digital Independente",
    baseDescription: "Você se adapta bem à tecnologia e gosta da liberdade que o mundo digital oferece. Prefere trabalhar com autonomia, no seu ritmo, sem depender de estruturas físicas ou horários rígidos. Tem facilidade para aprender ferramentas novas e valoriza a flexibilidade acima de tudo. Pessoas como você estão na vanguarda das novas formas de trabalho.",
    strengths: [
      "Você tem facilidade com tecnologia e ferramentas digitais",
      "Gosta de trabalhar com autonomia e flexibilidade total",
      "Se adapta rápido a novos formatos e plataformas",
    ],
    finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que aproveitam sua afinidade com o digital e sua busca por liberdade. São opções 100% online, flexíveis e escaláveis. Vamos te mostrar quais são.",
  },
};

// Função auxiliar para obter trava e motivação padrão quando não há resposta do quiz
export function getDefaultTravaMotivacao() {
  return {
    trava: TRAVAS_CONFIG.conhecimento,
    motivacao: MOTIVACOES_CONFIG.dinheiro,
  };
}

// Função auxiliar para obter trava baseada na resposta do quiz
export function getTravaFromAnswer(travaAnswer?: string) {
  return TRAVAS_CONFIG[travaAnswer || "conhecimento"] || TRAVAS_CONFIG.conhecimento;
}

// Função auxiliar para obter motivação baseada na resposta do quiz
export function getMotivacaoFromAnswer(motivacaoAnswer?: string) {
  return MOTIVACOES_CONFIG[motivacaoAnswer || "dinheiro"] || MOTIVACOES_CONFIG.dinheiro;
}
