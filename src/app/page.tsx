"use client";

import { useState, useEffect, Suspense } from "react";
import { ChevronRight, ChevronLeft, X, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { buscarRendexRecomendadas, type RendexCatalogo, type UserProfile as SupabaseUserProfile } from "@/lib/supabase";

// Tipos
type Answer = {
  question: number;
  answer: string;
};

type UserProfile = {
  type: string;
  title: string;
  description: string;
  strengths: string[];
  mainBlock: string;
  mainBlockDescription: string;
  seeking: string;
  seekingDescription: string;
  finalMessage: string;
};

// Perguntas do quiz com micro-feedbacks únicos por alternativa
const questions = [
  {
    id: 1,
    question: "Quanto tempo livre você tem por semana?",
    options: [
      { value: "menos-5h", label: "Menos de 5 horas" },
      { value: "5-10h", label: "5 a 10 horas" },
      { value: "10-20h", label: "10 a 20 horas" },
      { value: "mais-20h", label: "Mais de 20 horas" },
    ],
    feedbacks: {
      "menos-5h": "Mesmo com pouco tempo, ainda dá para construir uma renda extra com passos simples.",
      "5-10h": "Esse tempo já abre boas possibilidades. Vamos encontrar o que encaixa na sua rotina.",
      "10-20h": "Ótimo! Você tem espaço para algo consistente e com bom retorno.",
      "mais-20h": "Com esse tempo, você pode explorar várias oportunidades. Vamos aproveitar isso.",
    },
  },
  {
    id: 2,
    question: "Quanto você pode investir no início?",
    options: [
      { value: "nada", label: "Nada ou quase nada (R$ 0 - 100)" },
      { value: "pouco", label: "Pouco (R$ 100 - 500)" },
      { value: "medio", label: "Médio (R$ 500 - 2.000)" },
      { value: "alto", label: "Mais alto (acima de R$ 2.000)" },
    ],
    feedbacks: {
      nada: "Perfeito. Existem opções que começam praticamente do zero.",
      pouco: "Esse valor já permite explorar boas alternativas. Vamos encontrá-las.",
      medio: "Ótimo! Isso abre portas para começar com mais estrutura.",
      alto: "Excelente. Você tem capital para oportunidades mais robustas.",
    },
  },
  {
    id: 3,
    question: "O que você mais gosta de fazer?",
    options: [
      { value: "criar", label: "Criar coisas com as mãos" },
      { value: "conversar", label: "Conversar e ajudar pessoas" },
      { value: "organizar", label: "Organizar e planejar" },
      { value: "digital", label: "Trabalhar no computador" },
    ],
    feedbacks: {
      criar: "Sua criatividade pode se transformar em renda. Isso é valioso.",
      conversar: "Pessoas como você fazem a diferença. Esse é um talento real.",
      organizar: "Muita gente precisa dessa habilidade. Você tem algo importante.",
      digital: "O mundo digital está cheio de oportunidades. Você está no caminho certo.",
    },
  },
  {
    id: 4,
    question: "Como você prefere trabalhar?",
    options: [
      { value: "pessoas", label: "Diretamente com pessoas" },
      { value: "vender", label: "Vendendo produtos" },
      { value: "servico", label: "Prestando serviços" },
      { value: "online", label: "Totalmente online" },
    ],
    feedbacks: {
      pessoas: "Conexão humana é tudo. Você tem o perfil certo para isso.",
      vender: "Vendas movem o mundo. Seu perfil comercial é valioso.",
      servico: "Resolver problemas é gratificante. Você está no caminho certo.",
      online: "Liberdade e flexibilidade. O digital é perfeito para você.",
    },
  },
  {
    id: 5,
    question: "Quando você precisa do retorno financeiro?",
    options: [
      { value: "imediato", label: "Imediatamente (1-2 semanas)" },
      { value: "rapido", label: "Rápido (1 mês)" },
      { value: "medio", label: "Médio prazo (2-3 meses)" },
      { value: "longo", label: "Posso esperar (3+ meses)" },
    ],
    feedbacks: {
      imediato: "Entendido. Vamos focar em opções de retorno rápido para você.",
      rapido: "Certo. Há boas alternativas com retorno em poucas semanas.",
      medio: "Esse prazo permite construir algo mais sólido. Ótima escolha.",
      longo: "Paciência é virtude. Isso abre portas para projetos maiores.",
    },
  },
  {
    id: 6,
    question: "Qual seu objetivo mensal de renda extra?",
    options: [
      { value: "ate-500", label: "Até R$ 500" },
      { value: "500-1500", label: "R$ 500 a R$ 1.500" },
      { value: "1500-3000", label: "R$ 1.500 a R$ 3.000" },
      { value: "mais-3000", label: "Mais de R$ 3.000" },
    ],
    feedbacks: {
      "ate-500": "Todo começo é valioso. Esse valor já faz diferença no orçamento.",
      "500-1500": "Meta realista. Esse valor complementa bem a renda principal.",
      "1500-3000": "Objetivo ambicioso. Vamos encontrar o caminho para chegar lá.",
      "mais-3000": "Grande meta. Com dedicação, é totalmente possível alcançar.",
    },
  },
  {
    id: 7,
    question: "O que mais trava você hoje?",
    options: [
      { value: "tempo", label: "Falta de tempo" },
      { value: "dinheiro", label: "Falta de dinheiro para investir" },
      { value: "conhecimento", label: "Não sei por onde começar" },
      { value: "medo", label: "Medo de não dar certo" },
    ],
    feedbacks: {
      tempo: "Você não está sozinho nisso. Vamos encontrar algo que caiba na sua rotina.",
      dinheiro: "Isso é comum. Existem opções que começam com investimento mínimo.",
      conhecimento: "Normal sentir isso. Vamos te mostrar o caminho passo a passo.",
      medo: "É natural ter receio. Vamos começar com opções de baixo risco.",
    },
  },
  {
    id: 8,
    question: "Você prefere algo simples ou complexo?",
    options: [
      { value: "muito-simples", label: "Bem simples, direto ao ponto" },
      { value: "simples", label: "Simples, mas com alguma estrutura" },
      { value: "moderado", label: "Moderado, posso aprender no caminho" },
      { value: "complexo", label: "Complexo, gosto de desafios" },
    ],
    feedbacks: {
      "muito-simples": "Clareza é poder. Vamos focar no que é prático e funcional.",
      simples: "Equilíbrio perfeito. Simples com estrutura é o ideal.",
      moderado: "Ótima mentalidade. Aprender fazendo é o melhor caminho.",
      complexo: "Você gosta de desafios. Isso abre portas para projetos maiores.",
    },
  },
  {
    id: 9,
    question: "Como você lida com risco?",
    options: [
      { value: "evito", label: "Prefiro evitar riscos" },
      { value: "baixo", label: "Aceito riscos baixos e calculados" },
      { value: "moderado", label: "Aceito riscos moderados se valer a pena" },
      { value: "alto", label: "Não tenho medo de arriscar" },
    ],
    feedbacks: {
      evito: "Segurança primeiro. Vamos focar em opções estáveis e previsíveis.",
      baixo: "Prudência é sabedoria. Riscos calculados são os melhores.",
      moderado: "Equilíbrio ideal. Você sabe quando vale a pena arriscar.",
      alto: "Coragem admirável. Grandes riscos podem trazer grandes recompensas.",
    },
  },
  {
    id: 10,
    question: "Qual sua motivação principal?",
    options: [
      { value: "dinheiro", label: "Ganhar dinheiro extra" },
      { value: "independencia", label: "Ter independência financeira" },
      { value: "proposito", label: "Fazer algo com propósito" },
      { value: "liberdade", label: "Ter mais liberdade e flexibilidade" },
    ],
    feedbacks: {
      dinheiro: "Objetivo claro. Vamos encontrar a forma mais eficiente de alcançar isso.",
      independencia: "Sonho válido. A independência financeira está ao seu alcance.",
      proposito: "Inspirador. Trabalhar com propósito traz realização verdadeira.",
      liberdade: "Liberdade é tudo. Vamos encontrar o que te dá autonomia total.",
    },
  },
];

function RendExAppContent() {
  const [step, setStep] = useState<"home" | "quiz" | "feedback" | "loading" | "results">("home");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<RendexCatalogo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rendexRecomendadas, setRendexRecomendadas] = useState<RendexCatalogo[]>([]);
  const [loadingRendex, setLoadingRendex] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Salvar estado no localStorage antes de redirecionar para login
  const saveStateToLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const state = {
        step,
        answers,
        userProfile,
        rendexRecomendadas,
        currentQuestion,
      };
      localStorage.setItem('rendex-quiz-state', JSON.stringify(state));
    }
  };

  // Restaurar estado do localStorage após login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const savedState = localStorage.getItem('rendex-quiz-state');
      const rendexId = searchParams.get('rendex');
      
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          
          // Restaurar estado do quiz
          if (state.step) setStep(state.step);
          if (state.answers) setAnswers(state.answers);
          if (state.userProfile) setUserProfile(state.userProfile);
          if (state.rendexRecomendadas) setRendexRecomendadas(state.rendexRecomendadas);
          if (state.currentQuestion) setCurrentQuestion(state.currentQuestion);
          
          // Se há um rendexId específico, abrir o modal
          if (rendexId && state.rendexRecomendadas) {
            const rendex = state.rendexRecomendadas.find((r: RendexCatalogo) => r.id === rendexId);
            if (rendex) {
              setSelectedIdea(rendex);
              setShowDetails(true);
            }
          }
          
          // Limpar o estado salvo e o parâmetro da URL
          localStorage.removeItem('rendex-quiz-state');
          window.history.replaceState({}, '', '/');
        } catch (error) {
          console.error('Erro ao restaurar estado:', error);
          localStorage.removeItem('rendex-quiz-state');
        }
      }
    }
  }, [user, searchParams]);

  // Função para determinar o perfil do usuário com descrição completa e personalizada
  const determineProfile = (userAnswers: Answer[]): UserProfile => {
    const profileScores = {
      executor: 0,
      social: 0,
      estrategista: 0,
      digital: 0,
    };

    userAnswers.forEach((answer) => {
      switch (answer.question) {
        case 3: // O que gosta de fazer
          if (answer.answer === "criar") profileScores.executor += 3;
          if (answer.answer === "conversar") profileScores.social += 3;
          if (answer.answer === "organizar") profileScores.estrategista += 3;
          if (answer.answer === "digital") profileScores.digital += 3;
          break;
        case 4: // Como prefere trabalhar
          if (answer.answer === "pessoas") profileScores.social += 2;
          if (answer.answer === "vender") profileScores.social += 2;
          if (answer.answer === "servico") profileScores.executor += 2;
          if (answer.answer === "online") profileScores.digital += 2;
          break;
        case 8: // Simples ou complexo
          if (answer.answer === "muito-simples" || answer.answer === "simples")
            profileScores.executor += 2;
          if (answer.answer === "moderado") profileScores.estrategista += 2;
          if (answer.answer === "complexo") profileScores.digital += 2;
          break;
        case 9: // Como lida com risco
          if (answer.answer === "evito") profileScores.estrategista += 2;
          if (answer.answer === "baixo") profileScores.executor += 2;
          if (answer.answer === "moderado") profileScores.social += 2;
          if (answer.answer === "alto") profileScores.digital += 2;
          break;
      }
    });

    const maxScore = Math.max(...Object.values(profileScores));
    const profileType = Object.keys(profileScores).find(
      (key) => profileScores[key as keyof typeof profileScores] === maxScore
    ) as keyof typeof profileScores;

    // Extrair dados das respostas para personalização
    const tempoAnswer = userAnswers.find((a) => a.question === 1);
    const investimentoAnswer = userAnswers.find((a) => a.question === 2);
    const retornoAnswer = userAnswers.find((a) => a.question === 5);
    const objetivoAnswer = userAnswers.find((a) => a.question === 6);
    const travaAnswer = userAnswers.find((a) => a.question === 7);
    const motivacaoAnswer = userAnswers.find((a) => a.question === 10);

    // Mapear tempo
    const tempoMap: Record<string, string> = {
      "menos-5h": "menos de 5 horas por semana",
      "5-10h": "entre 5 e 10 horas por semana",
      "10-20h": "entre 10 e 20 horas por semana",
      "mais-20h": "mais de 20 horas por semana",
    };
    const tempoDisponivel = tempoMap[tempoAnswer?.answer || "menos-5h"];

    // Mapear investimento
    const investimentoMap: Record<string, string> = {
      nada: "praticamente nenhum investimento inicial",
      pouco: "um investimento inicial baixo",
      medio: "um investimento inicial moderado",
      alto: "um bom capital inicial",
    };
    const investimentoDisponivel = investimentoMap[investimentoAnswer?.answer || "nada"];

    // Mapear retorno
    const retornoMap: Record<string, string> = {
      imediato: "precisa de retorno imediato",
      rapido: "precisa de retorno rápido",
      medio: "pode esperar um retorno em médio prazo",
      longo: "tem paciência para construir algo a longo prazo",
    };
    const urgenciaRetorno = retornoMap[retornoAnswer?.answer || "rapido"];

    // Mapear objetivo
    const objetivoMap: Record<string, string> = {
      "ate-500": "até R$ 500",
      "500-1500": "entre R$ 500 e R$ 1.500",
      "1500-3000": "entre R$ 1.500 e R$ 3.000",
      "mais-3000": "mais de R$ 3.000",
    };
    const objetivoMensal = objetivoMap[objetivoAnswer?.answer || "ate-500"];

    // Determinar trava principal
    const travaMap: Record<string, { nome: string; descricao: string }> = {
      tempo: {
        nome: "falta de tempo",
        descricao: "Eu sei que sua rotina é corrida e parece que não sobra espaço para mais nada. Mas isso não significa que você não possa começar. Existem opções de Rendex que se encaixam em pequenos intervalos do seu dia, sem exigir horas seguidas de dedicação. O segredo está em escolher algo que funcione com o tempo que você tem, não contra ele.",
      },
      dinheiro: {
        nome: "investimento inicial limitado",
        descricao: "Começar sem dinheiro pode parecer impossível, mas não é. Muitas pessoas constroem suas primeiras rendas extras com zero ou quase zero de investimento. O que você precisa é de uma direção clara e de opções que valorizem suas habilidades, não o tamanho da sua conta bancária. E isso existe.",
      },
      conhecimento: {
        nome: "não saber por onde começar",
        descricao: "A sensação de estar perdido é uma das mais comuns quando pensamos em começar algo novo. Mas isso não é falta de capacidade, é apenas falta de um mapa. Você não precisa saber tudo antes de começar. Precisa apenas de um primeiro passo claro, e é exatamente isso que vamos te dar.",
      },
      medo: {
        nome: "medo de não dar certo",
        descricao: "O medo de falhar é natural, e mostra que você se importa com o resultado. Mas deixar o medo decidir por você é abrir mão de oportunidades reais. A boa notícia é que existem formas de começar com baixo risco, testando aos poucos, sem colocar tudo em jogo. Você não precisa de coragem cega, precisa de um caminho seguro.",
      },
    };
    const travaData = travaMap[travaAnswer?.answer || "conhecimento"];

    // Determinar motivação
    const motivacaoMap: Record<string, { nome: string; descricao: string }> = {
      dinheiro: {
        nome: "aumentar sua renda mensal",
        descricao: "Você quer mais dinheiro no final do mês, e isso é completamente legítimo. Não é sobre luxo, é sobre respirar melhor, ter mais margem, conseguir pagar as contas sem aperto. Esse objetivo é claro, direto e alcançável. E quando você encontra a Rendex certa, o dinheiro começa a entrar de forma consistente.",
      },
      independencia: {
        nome: "conquistar independência financeira",
        descricao: "Você não quer apenas ganhar mais, você quer depender menos. Quer ter a sensação de que está no controle da sua vida financeira, que não precisa pedir permissão ou esperar por ninguém. Essa busca por autonomia é poderosa, e construir uma renda extra é um dos passos mais concretos para chegar lá.",
      },
      proposito: {
        nome: "trabalhar com propósito e significado",
        descricao: "Para você, não é só sobre o dinheiro. É sobre fazer algo que tenha sentido, que te faça sentir útil, que traga realização. Você quer acordar sabendo que está construindo algo que importa, mesmo que seja pequeno. E quando você encontra uma Rendex alinhada com seus valores, o trabalho deixa de ser peso e vira motivação.",
      },
      liberdade: {
        nome: "ter mais liberdade e flexibilidade",
        descricao: "Você valoriza a liberdade acima de quase tudo. Quer poder escolher seus horários, trabalhar de onde quiser, não ficar preso a uma rotina rígida. Essa busca por flexibilidade não é preguiça, é uma forma inteligente de viver. E existem tipos de Rendex que te dão exatamente isso: autonomia total sobre o seu tempo.",
      },
    };
    const motivacaoData = motivacaoMap[motivacaoAnswer?.answer || "dinheiro"];

    const profiles = {
      executor: {
        type: "executor",
        title: "Executor Prático",
        description: "Você é do tipo que gosta de colocar a mão na massa e ver resultado rápido. Não perde tempo com teorias complicadas, prefere o que é direto, funcional e tangível. Quando decide fazer algo, vai até o fim. Você valoriza a simplicidade e tem facilidade para transformar ideias em ação. Pessoas como você constroem coisas reais, com consistência e determinação.",
        strengths: [
          "Você tem facilidade para executar e finalizar tarefas",
          "Prefere o que é prático e traz resultados visíveis",
          "Tem habilidade manual ou criativa que pode ser monetizada",
        ],
        mainBlock: travaData.nome,
        mainBlockDescription: travaData.descricao,
        seeking: motivacaoData.nome,
        seekingDescription: motivacaoData.descricao,
        finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que combinam perfeitamente com o seu jeito de trabalhar. São opções práticas, diretas e que valorizam sua capacidade de executar. Vamos te mostrar agora quais são as melhores para você começar.",
      },
      social: {
        type: "social",
        title: "Social Comunicador",
        description: "Você se conecta bem com pessoas. Tem facilidade para conversar, criar vínculos e fazer os outros se sentirem à vontade. Gosta de ajudar, de estar presente, de fazer diferença na vida de quem está ao seu redor. Você não vê trabalho apenas como tarefa, vê como oportunidade de construir relacionamentos. E isso é um talento raro e valioso.",
        strengths: [
          "Você tem facilidade natural para se comunicar e criar conexões",
          "Gosta de trabalhar com pessoas e ajudar os outros",
          "Tem empatia e sabe ouvir, o que gera confiança",
        ],
        mainBlock: travaData.nome,
        mainBlockDescription: travaData.descricao,
        seeking: motivacaoData.nome,
        seekingDescription: motivacaoData.descricao,
        finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que valorizam exatamente o que você tem de melhor: sua capacidade de se conectar com pessoas. São opções onde sua comunicação e empatia se transformam em renda. Vamos te mostrar quais são.",
      },
      estrategista: {
        type: "estrategista",
        title: "Estrategista Organizado",
        description: "Você gosta de planejar, estruturar e ter controle sobre o que está fazendo. Não age por impulso, prefere entender o cenário antes de tomar decisões. Tem atenção aos detalhes e valoriza a segurança. Pessoas como você constroem bases sólidas, evitam erros desnecessários e sabem que consistência vale mais que velocidade.",
        strengths: [
          "Você tem habilidade para organizar, planejar e estruturar processos",
          "Presta atenção aos detalhes e evita decisões impulsivas",
          "Valoriza segurança e previsibilidade, o que reduz riscos",
        ],
        mainBlock: travaData.nome,
        mainBlockDescription: travaData.descricao,
        seeking: motivacaoData.nome,
        seekingDescription: motivacaoData.descricao,
        finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que combinam com seu perfil organizado e estratégico. São opções que permitem planejamento, controle e crescimento sustentável. Vamos te mostrar quais são as melhores para você.",
      },
      digital: {
        type: "digital",
        title: "Digital Independente",
        description: "Você se adapta bem à tecnologia e gosta da liberdade que o mundo digital oferece. Prefere trabalhar com autonomia, no seu ritmo, sem depender de estruturas físicas ou horários rígidos. Tem facilidade para aprender ferramentas novas e valoriza a flexibilidade acima de tudo. Pessoas como você estão na vanguarda das novas formas de trabalho.",
        strengths: [
          "Você tem facilidade com tecnologia e ferramentas digitais",
          "Gosta de trabalhar com autonomia e flexibilidade total",
          "Se adapta rápido a novos formatos e plataformas",
        ],
        mainBlock: travaData.nome,
        mainBlockDescription: travaData.descricao,
        seeking: motivacaoData.nome,
        seekingDescription: motivacaoData.descricao,
        finalMessage: "Existem tipos de Rendex (renda extra ou pequeno empreendimento) que aproveitam sua afinidade com o digital e sua busca por liberdade. São opções 100% online, flexíveis e escaláveis. Vamos te mostrar quais são.",
      },
    };

    const profile = profiles[profileType];

    // Adicionar contexto personalizado no início
    const contextoInicial = `Você tem ${tempoDisponivel} disponível, ${investimentoDisponivel}, ${urgenciaRetorno} e busca alcançar ${objetivoMensal} por mês. Eu entendo o seu momento. Você está buscando uma forma real de aumentar sua renda, mas precisa que isso faça sentido com a sua realidade. E é exatamente isso que vamos construir juntos.`;

    return {
      ...profile,
      description: `${contextoInicial}\n\n${profile.description}`,
    };
  };

  // Função para converter respostas do quiz em perfil do Supabase
  const convertToSupabaseProfile = (userAnswers: Answer[]): SupabaseUserProfile => {
    const tempoAnswer = userAnswers.find((a) => a.question === 1);
    const investimentoAnswer = userAnswers.find((a) => a.question === 2);
    const retornoAnswer = userAnswers.find((a) => a.question === 5);
    const objetivoAnswer = userAnswers.find((a) => a.question === 6);
    const preferenciaAnswer = userAnswers.find((a) => a.question === 4);

    // Determinar perfil Rendex
    const profileScores = {
      executor: 0,
      social: 0,
      estrategista: 0,
      digital: 0,
    };

    userAnswers.forEach((answer) => {
      switch (answer.question) {
        case 3:
          if (answer.answer === "criar") profileScores.executor += 3;
          if (answer.answer === "conversar") profileScores.social += 3;
          if (answer.answer === "organizar") profileScores.estrategista += 3;
          if (answer.answer === "digital") profileScores.digital += 3;
          break;
        case 4:
          if (answer.answer === "pessoas") profileScores.social += 2;
          if (answer.answer === "vender") profileScores.social += 2;
          if (answer.answer === "servico") profileScores.executor += 2;
          if (answer.answer === "online") profileScores.digital += 2;
          break;
        case 8:
          if (answer.answer === "muito-simples" || answer.answer === "simples")
            profileScores.executor += 2;
          if (answer.answer === "moderado") profileScores.estrategista += 2;
          if (answer.answer === "complexo") profileScores.digital += 2;
          break;
        case 9:
          if (answer.answer === "evito") profileScores.estrategista += 2;
          if (answer.answer === "baixo") profileScores.executor += 2;
          if (answer.answer === "moderado") profileScores.social += 2;
          if (answer.answer === "alto") profileScores.digital += 2;
          break;
      }
    });

    const maxScore = Math.max(...Object.values(profileScores));
    const profileType = Object.keys(profileScores).find(
      (key) => profileScores[key as keyof typeof profileScores] === maxScore
    ) as keyof typeof profileScores;

    const profileMap = {
      executor: "Executor Prático",
      social: "Social Comunicador",
      estrategista: "Estratégico Analítico",
      digital: "Digital Independente",
    };

    // Mapear investimento para valor numérico
    const investimentoValorMap: Record<string, number> = {
      nada: 100,
      pouco: 500,
      medio: 2000,
      alto: 10000,
    };

    return {
      perfil_rendex: profileMap[profileType],
      tempo_disponivel: tempoAnswer?.answer || "menos-5h",
      investimento_disponivel: investimentoValorMap[investimentoAnswer?.answer || "nada"],
      urgencia_retorno: retornoAnswer?.answer || "rapido",
      preferencia_trabalho: preferenciaAnswer?.answer || "servico",
      objetivo_mensal: objetivoAnswer?.answer || "ate-500",
    };
  };

  const handleAnswer = (value: string) => {
    const newAnswers = [
      ...answers.filter((a) => a.question !== currentQuestion + 1),
      { question: currentQuestion + 1, answer: value },
    ];
    setAnswers(newAnswers);

    // Pegar feedback específico da alternativa escolhida
    const currentQ = questions[currentQuestion];
    const feedback = currentQ.feedbacks[value as keyof typeof currentQ.feedbacks];
    setCurrentFeedback(feedback);

    // Mostrar tela de feedback
    setStep("feedback");

    // Aguardar 4.7 segundos antes de avançar
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setStep("quiz");
      } else {
        // Última pergunta - ir para loading
        setStep("loading");
        const profile = determineProfile(newAnswers);
        setUserProfile(profile);

        // Buscar Rendex recomendadas do Supabase
        const supabaseProfile = convertToSupabaseProfile(newAnswers);
        setLoadingRendex(true);
        buscarRendexRecomendadas(supabaseProfile).then((rendex) => {
          setRendexRecomendadas(rendex);
          setLoadingRendex(false);
        });

        // Aguardar 2.8 segundos no loading
        setTimeout(() => {
          setStep("results");
        }, 2800);
      }
    }, 4700);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Tela Inicial
  if (step === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
        {/* Botão Pular quiz no topo esquerdo */}
        <div className="absolute top-6 left-6">
          <button
            onClick={() => {
              if (user) {
                router.push("/home");
              } else {
                router.push("/auth/login?redirect=/home");
              }
            }}
            className="text-[#7A9CC6] hover:text-[#8A7CA8] font-medium transition-colors"
          >
            Pular quiz →
          </button>
        </div>

        {/* Botão de perfil (se logado) */}
        {user && (
          <div className="absolute top-6 right-6">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <User className="w-5 h-5 text-[#7A9CC6]" />
              <span className="text-sm font-medium text-[#7A9CC6]">Perfil</span>
            </Link>
          </div>
        )}

        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo Real */}
          <div className="flex justify-center mb-8">
            <div className="relative transform hover:scale-105 transition-transform">
              <Image
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/011de2a3-0a6d-44e7-8fd4-6d4fc406cc06.png"
                alt="RendEx Logo"
                width={140}
                height={140}
                className="w-32 h-32 md:w-36 md:h-36 object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] bg-clip-text text-transparent">
              RendEx
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-[#7A9CC6]">
              Descubra sua renda extra ideal
            </p>
          </div>

          {/* Descrição */}
          <p className="text-lg text-gray-700 leading-relaxed px-4">
            Faça um teste rápido e descubra qual renda extra combina perfeitamente
            com seu perfil, tempo disponível e objetivos.
          </p>

          {/* Botão */}
          <button
            onClick={() => setStep("quiz")}
            className="group relative w-full max-w-xs mx-auto py-4 px-8 bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              Começar
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Indicadores */}
          <div className="flex justify-center gap-6 pt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7A9CC6]"></div>
              <span>10 perguntas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F5C6C6]"></div>
              <span>3 minutos</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Feedback (transição entre perguntas)
  if (step === "feedback") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
          {/* Feedback emocional */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <p className="text-xl md:text-2xl font-medium text-[#7A9CC6] leading-relaxed">
              {currentFeedback}
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Tela de Loading
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Mensagens de loading */}
          <div className="space-y-4">
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] animate-loading"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-[#7A9CC6]">
              Analisando suas respostas
            </h2>
            
            <p className="text-lg text-gray-700">
              Estou preparando o melhor caminho de Rendex para você.
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes loading {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
          .animate-loading {
            animation: loading 2.8s ease-in-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // Quiz
  if (step === "quiz") {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const currentQ = questions[currentQuestion];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col p-6">
        {/* Header com progresso */}
        <div className="max-w-2xl w-full mx-auto mb-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-[#7A9CC6]" />
            </button>
            <span className="text-sm font-medium text-[#7A9CC6]">
              Pergunta {currentQuestion + 1} de {questions.length}
            </span>
            <div className="w-10"></div>
          </div>

          {/* Barra de progresso */}
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Pergunta */}
        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-8">
              {currentQ.question}
            </h2>

            {/* Opções */}
            <div className="space-y-4">
              {currentQ.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-5 rounded-2xl text-left transition-all duration-300 transform hover:scale-102 bg-white hover:bg-gradient-to-r hover:from-[#D6EAF8] hover:to-[#FFE8E8] text-gray-700 shadow-md hover:shadow-lg"
                >
                  <span className="font-medium text-lg">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Resultados
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-6 pb-12">
      {/* Botão de perfil (se logado) */}
      {user && (
        <div className="absolute top-6 right-6">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <User className="w-5 h-5 text-[#7A9CC6]" />
            <span className="text-sm font-medium text-[#7A9CC6]">Perfil</span>
          </Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Perfil do usuário */}
        {userProfile && (
          <div className="max-w-3xl mx-auto mb-12 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl space-y-8">
              {/* 1. Validação da situação atual */}
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {userProfile.description}
                </p>
              </div>

              {/* 2. Perfil identificado */}
              <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] p-6 rounded-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-3 text-center">
                  Seu Perfil: {userProfile.title}
                </h2>
              </div>

              {/* 3. Pontos fortes */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-4">
                  Seus pontos fortes:
                </h3>
                <ul className="space-y-3">
                  {userProfile.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="text-[#F5C6C6] text-xl mt-0.5">✓</span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Trava principal */}
              <div className="bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  Sua maior trava: {userProfile.mainBlock}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {userProfile.mainBlockDescription}
                </p>
              </div>

              {/* 5. Motivação principal */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  O que você realmente busca: {userProfile.seeking}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {userProfile.seekingDescription}
                </p>
              </div>

              {/* 6. Mensagem final */}
              <div className="pt-6 border-t border-[#7A9CC6]/20">
                <p className="text-center text-gray-700 leading-relaxed font-medium">
                  {userProfile.finalMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#7A9CC6] mb-3">
            Suas Rendas Extras Ideais
          </h1>
          <p className="text-lg text-gray-700">
            Estas são as opções que mais combinam com você
          </p>
        </div>

        {/* Loading ou Cards de resultados */}
        {loadingRendex ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
            <p className="mt-4 text-gray-600">Carregando suas Rendex personalizadas...</p>
          </div>
        ) : rendexRecomendadas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Ainda não encontramos uma RendEx perfeita para o seu perfil, mas estamos atualizando o catálogo com novas oportunidades. Refaça o teste em alguns dias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {rendexRecomendadas.map((rendex, index) => (
              <div
                key={rendex.id}
                className={`relative bg-white rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300 ${
                  index === 0 ? "ring-4 ring-[#F5C6C6]" : ""
                }`}
              >
                {/* Badge de recomendação */}
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#F5C6C6] to-[#8A7CA8] text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg">
                      ⭐ Mais recomendada
                    </div>
                  </div>
                )}

                <div className="space-y-4 mt-2">
                  {/* Nome */}
                  <h3 className="text-2xl font-bold text-[#7A9CC6]">{rendex.nome}</h3>

                  {/* Descrição */}
                  <p className="text-gray-600 leading-relaxed">{rendex.descricao_curta}</p>

                  {/* Categoria */}
                  <div className="inline-block bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] px-3 py-1 rounded-full text-sm font-medium text-[#7A9CC6]">
                    {rendex.categoria}
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Investimento:</span>
                      <span className="font-semibold text-[#7A9CC6]">
                        R$ {rendex.investimento_inicial}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Tempo de início:</span>
                      <span className="font-semibold text-[#7A9CC6]">
                        {rendex.tempo_inicio.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Ganho inicial:</span>
                      <span className="font-semibold text-[#7A9CC6]">
                        {rendex.ganho_inicial_estimado}
                      </span>
                    </div>
                  </div>

                  {/* Botão de detalhes */}
                  <button
                    onClick={() => {
                      // Se não estiver logado, salvar estado e redirecionar para login
                      if (!user) {
                        saveStateToLocalStorage();
                        router.push(`/auth/login?redirect=${encodeURIComponent(`/?rendex=${rendex.id}`)}`)
                        return;
                      }
                      // Se estiver logado, mostrar detalhes
                      setSelectedIdea(rendex);
                      setShowDetails(true);
                    }}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Ver Passo a Passo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão de refazer */}
        <div className="text-center">
          <button
            onClick={() => {
              setStep("home");
              setCurrentQuestion(0);
              setAnswers([]);
              setUserProfile(null);
              setRendexRecomendadas([]);
            }}
            className="py-3 px-8 bg-white text-[#7A9CC6] font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Refazer Teste
          </button>
        </div>
      </div>

      {/* Modal de detalhes */}
      {showDetails && selectedIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header do modal */}
            <div className="sticky top-0 bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedIdea.nome}
                  </h2>
                  <p className="text-white/90">{selectedIdea.descricao_curta}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-8 space-y-6">
              {/* Primeiro passo (conteúdo gratuito) */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  🎯 Primeiro Passo (Gratuito)
                </h3>
                <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] p-4 rounded-xl">
                  {selectedIdea.primeiro_passo}
                </p>
              </div>

              {/* Teste 24h */}
              <div>
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  ⚡ Teste em 24 horas
                </h3>
                <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 p-4 rounded-xl">
                  {selectedIdea.teste_24h}
                </p>
              </div>

              {/* Passo premium (resumo) */}
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-[#7A9CC6]/30">
                <h3 className="text-xl font-bold text-[#7A9CC6] mb-3">
                  🔒 Passo a Passo Completo (Premium)
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {selectedIdea.passo_premium_resumo}
                </p>
                <button
                  disabled
                  className="w-full py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 font-bold rounded-xl cursor-not-allowed opacity-60"
                >
                  Em breve disponível
                </button>
              </div>

              {/* Informações rápidas */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Investimento</div>
                  <div className="font-bold text-[#7A9CC6]">
                    R$ {selectedIdea.investimento_inicial}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Complexidade</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.complexidade}/5
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Ganho inicial</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.ganho_inicial_estimado}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Em 3 meses</div>
                  <div className="font-bold text-[#7A9CC6]">
                    {selectedIdea.ganho_3meses_estimado}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente wrapper com Suspense
export default function RendExApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
      </div>
    }>
      <RendExAppContent />
    </Suspense>
  );
}
