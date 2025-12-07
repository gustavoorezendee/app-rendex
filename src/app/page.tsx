"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { ChevronRight, ChevronLeft, X, User, Lock, Crown, Clock, HelpCircle, Sparkles, Home, Target, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { 
  buscarRendexRecomendadas, 
  salvarResultadoQuiz,
  buscarResultadoQuiz,
  limparResultadoQuiz,
  supabase, 
  type RendexCatalogo, 
  type UserProfile as SupabaseUserProfile 
} from "@/lib/supabase";


import { 
  PROFILES_CONFIG, 
  TRAVAS_CONFIG,
  getTravaFromAnswer,
  getMotivacaoFromAnswer,
  getDefaultTravaMotivacao
} from "@/lib/quizProfiles";
import { ThemeToggle } from "@/components/ThemeToggle";

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

// Chave para localStorage
const QUIZ_RESULT_STORAGE_KEY = 'rendex-quiz-result-temp';

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rendexRecomendadas, setRendexRecomendadas] = useState<RendexCatalogo[]>([]);
  const [loadingRendex, setLoadingRendex] = useState(false);
  const [showResultadoSalvo, setShowResultadoSalvo] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Novo estado para controlar o timer do feedback
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isPremium = profile?.plano === "premium";

  // Carregar último resultado salvo quando usuário está logado
  useEffect(() => {
    const carregarResultadoSalvo = async () => {
      // Verificar se usuário está refazendo o quiz
      const refazendoQuiz = typeof window !== 'undefined' && localStorage.getItem("refazendo_quiz") === "true";
      
      // Só carregar se:
      // 1. Usuário está logado
      // 2. Não há resultado atual em memória (rendexRecomendadas vazio)
      // 3. Está na tela home (não está no meio do quiz)
      // 4. NÃO está refazendo o quiz
      if (!user || rendexRecomendadas.length > 0 || step !== "home" || refazendoQuiz) {
        return;
      }

      try {
        // Buscar resultado salvo do usuário usando a nova função
        const resultadoSalvo = await buscarResultadoQuiz(user.id);

        if (!resultadoSalvo) {
          // Não há resultado salvo, usuário fará o quiz normalmente
          return;
        }

        // Buscar as rendex correspondentes aos IDs salvos
        const { data: rendexData, error: errorRendex } = await supabase
          .from('rendex_catalogo')
          .select('*')
          .in('id', resultadoSalvo.rendexIds);

        if (errorRendex || !rendexData || rendexData.length === 0) {
          console.error('Erro ao buscar rendex salvas:', errorRendex);
          return;
        }

        // Reordenar as RendEx na mesma ordem dos IDs salvos
        const rendexOrdenadas = resultadoSalvo.rendexIds
          .map(id => rendexData.find(r => r.id === id))
          .filter((r): r is RendexCatalogo => r !== undefined);

        // Reconstruir o perfil do usuário baseado no perfil_rendex salvo
        // Usar configuração centralizada de perfis
        const perfilConfig = PROFILES_CONFIG[resultadoSalvo.perfilIdeal] || PROFILES_CONFIG["Executor Prático"];
        
        // Obter trava e motivação padrão (já que não temos as respostas específicas do quiz salvas)
        const { trava, motivacao } = getDefaultTravaMotivacao();

        const perfilReconstruido: UserProfile = {
          type: perfilConfig.type,
          title: perfilConfig.title,
          description: perfilConfig.baseDescription,
          strengths: perfilConfig.strengths,
          mainBlock: trava.titulo,
          mainBlockDescription: trava.descricao,
          seeking: motivacao.titulo,
          seekingDescription: motivacao.descricao,
          finalMessage: perfilConfig.finalMessage,
        };

        // Preencher os estados
        setUserProfile(perfilReconstruido);
        setRendexRecomendadas(rendexOrdenadas);
        setShowResultadoSalvo(true);
        setStep("results");

      } catch (error) {
        console.error('Erro ao carregar resultado salvo:', error);
      }
    };

    carregarResultadoSalvo();
  }, [user, rendexRecomendadas.length, step]);

  // Vincular resultado do localStorage ao usuário após login
  useEffect(() => {
    const vincularResultadoAposLogin = async () => {
      // Só executar se:
      // 1. Usuário acabou de logar
      // 2. Existe resultado temporário no localStorage
      // 3. Ainda não carregou resultado do banco
      if (!user || rendexRecomendadas.length > 0) {
        return;
      }

      try {
        // Verificar se existe resultado temporário no localStorage
        const resultadoTemp = localStorage.getItem(QUIZ_RESULT_STORAGE_KEY);
        
        if (!resultadoTemp) {
          return;
        }

        const { perfilIdeal, rendexIds, timestamp } = JSON.parse(resultadoTemp);

        // Verificar se o resultado não é muito antigo (máximo 24 horas)
        const horasPassadas = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (horasPassadas > 24) {
          // Resultado muito antigo, limpar
          localStorage.removeItem(QUIZ_RESULT_STORAGE_KEY);
          return;
        }

        // Salvar resultado no banco vinculado ao usuário
        const sucesso = await salvarResultadoQuiz({
          userId: user.id,
          perfilIdeal,
          rendexIds,
        });

        if (sucesso) {
          console.log('✅ Resultado do quiz vinculado ao usuário com sucesso!');
          
          // Limpar localStorage após vincular
          localStorage.removeItem(QUIZ_RESULT_STORAGE_KEY);
          
          // Recarregar a página para exibir o resultado
          window.location.reload();
        }
      } catch (error) {
        console.error('Erro ao vincular resultado após login:', error);
      }
    };

    vincularResultadoAposLogin();
  }, [user, rendexRecomendadas.length]);

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

    // Usar configuração centralizada para travas e motivações
    const travaData = getTravaFromAnswer(travaAnswer?.answer);
    const motivacaoData = getMotivacaoFromAnswer(motivacaoAnswer?.answer);

    // Mapear tipo de perfil para nome completo
    const profileNameMap = {
      executor: "Executor Prático",
      social: "Social Comunicador",
      estrategista: "Estratégico Analítico",
      digital: "Digital Independente",
    };

    const profileName = profileNameMap[profileType];
    const profileConfig = PROFILES_CONFIG[profileName];

    // Construir perfil completo usando configuração centralizada
    const profile = {
      type: profileConfig.type,
      title: profileConfig.title,
      description: profileConfig.baseDescription,
      strengths: profileConfig.strengths,
      mainBlock: travaData.titulo,
      mainBlockDescription: travaData.descricao,
      seeking: motivacaoData.titulo,
      seekingDescription: motivacaoData.descricao,
      finalMessage: profileConfig.finalMessage,
    };

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

  // Função para salvar resultado no Supabase ou localStorage (com UPSERT)
  const salvarResultado = async (perfilRendex: string, rendexIds: string[]) => {
    if (user) {
      // Usuário logado: salvar no banco com UPSERT
      const sucesso = await salvarResultadoQuiz({
        userId: user.id,
        perfilIdeal: perfilRendex,
        rendexIds: rendexIds,
      });

      if (sucesso) {
        console.log('✅ Resultado do quiz salvo/atualizado no banco com sucesso!');
      } else {
        console.error('❌ Falha ao salvar resultado do quiz no banco');
      }
    } else {
      // Usuário NÃO logado: salvar no localStorage
      try {
        const resultadoTemp = {
          perfilIdeal: perfilRendex,
          rendexIds: rendexIds,
          timestamp: Date.now(),
        };
        localStorage.setItem(QUIZ_RESULT_STORAGE_KEY, JSON.stringify(resultadoTemp));
        console.log('✅ Resultado do quiz salvo no localStorage temporariamente');
      } catch (error) {
        console.error('❌ Erro ao salvar resultado no localStorage:', error);
      }
    }
  };

  // Função para avançar para a próxima pergunta (reutilizável)
  const avancarParaProximaPergunta = (newAnswers: Answer[]) => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setStep("quiz");
    } else {
      // Última pergunta - ir para loading e finalizar quiz
      handleFinishQuiz(newAnswers);
    }
  };

  // Função para finalizar o quiz com try/catch
  const handleFinishQuiz = async (newAnswers: Answer[]) => {
    try {
      setIsSavingResult(true);
      setStep("loading");
      
      // Calcular perfil
      const profile = determineProfile(newAnswers);
      setUserProfile(profile);

      // Buscar Rendex recomendadas do Supabase
      const supabaseProfile = convertToSupabaseProfile(newAnswers);
      setLoadingRendex(true);
      
      const rendex = await buscarRendexRecomendadas(supabaseProfile);
      setRendexRecomendadas(rendex);
      setLoadingRendex(false);

      // Salvar resultado (UPSERT no banco se logado, localStorage se não logado)
      if (rendex.length > 0) {
        const rendexIds = rendex.map(r => r.id);
        await salvarResultado(supabaseProfile.perfil_rendex, rendexIds);
      }

      // Remover estado de refazendo_quiz quando terminar o quiz
      if (typeof window !== 'undefined') {
        localStorage.removeItem("refazendo_quiz");
      }

      // Aguardar 2.8 segundos no loading
      setTimeout(() => {
        setStep("results");
        setIsSavingResult(false);
      }, 2800);

    } catch (err) {
      console.error("Erro ao finalizar quiz:", err);
      setIsSavingResult(false);
      setLoadingRendex(false);
      
      // Fallback: mostrar mensagem de erro mas não quebrar a tela
      alert("Ocorreu um erro ao salvar seu resultado. Por favor, tente novamente.");
      
      // Voltar para a última pergunta
      setStep("quiz");
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = [
      ...answers.filter((a) => a.question !== currentQuestion + 1),
      { question: currentQuestion + 1, answer: value },
    ];
    setAnswers(newAnswers);

    // Pegar feedback específico da alternativa escolhida
    const currentQ = questions[currentQuestion];
    const feedback = currentQ.feedbacks[value as keyof typeof currentQ.feedbacks] || "";
    setCurrentFeedback(feedback);

    // Mostrar tela de feedback
    setStep("feedback");

    // Aguardar 4.7 segundos antes de avançar automaticamente
    const timerId = setTimeout(() => {
      avancarParaProximaPergunta(newAnswers);
    }, 4700);

    // Armazenar o ID do timer para poder cancelá-lo depois
    feedbackTimerRef.current = timerId;
  };

  // Função para avançar manualmente (ao clicar no botão "Próximo")
  const handleAvancarManual = () => {
    // Cancelar o timer automático
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    // Avançar imediatamente
    avancarParaProximaPergunta(answers);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleVoltarParaInicio = () => {
    setStep("home");
    setCurrentQuestion(0);
    setAnswers([]);
  };

  // Função centralizada para resetar todo o estado do quiz
  const resetQuizState = () => {
    // Zera a pergunta atual
    setCurrentQuestion(0);

    // Limpa respostas e feedbacks
    setAnswers([]);
    setCurrentFeedback("");

    // Limpa qualquer estado de resultado / perfil
    setUserProfile(null);
    setRendexRecomendadas([]);
    setShowResultadoSalvo(false);
    setIsSavingResult(false);
    setLoadingRendex(false);

    // Limpa timers pendentes
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    // Garante que o passo volte para o início do quiz
    setStep("quiz");
  };

  const handleRefazerQuiz = async () => {
    // Limpar resultado salvo no Supabase (se usuário estiver logado)
    if (user) {
      const sucesso = await limparResultadoQuiz(user.id);
      if (!sucesso) {
        console.error('Erro ao limpar resultado do quiz');
        // Continuar mesmo assim, pois o usuário quer refazer
      }
    }
    
    // Limpar localStorage também (caso exista resultado temporário)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUIZ_RESULT_STORAGE_KEY);
      // Setar estado de refazendo_quiz
      localStorage.setItem("refazendo_quiz", "true");
    }
    
    // Resetar todos os estados usando a função centralizada
    resetQuizState();
  };

  const handleIrParaInicio = () => {
    router.push("/home");
  };

  const handleEntrar = () => {
    if (user) {
      // Se já está logado, redirecionar para /home
      router.push("/home");
    } else {
      // Se não está logado, redirecionar para login
      router.push("/auth/login?redirect=/home");
    }
  };

  // Fallback de segurança: se step === "results" mas não há resultado
  if (step === "results" && !userProfile && !isLoadingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-6">
        <ThemeToggle />
        <div className="max-w-md w-full text-center space-y-6">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Você ainda não concluiu o Quiz. Volte ao início e responda às perguntas.
          </p>
          <button
            onClick={handleVoltarParaInicio}
            className="px-6 py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Voltar ao início do quiz
          </button>
        </div>
      </div>
    );
  }

  // Loading do resultado
  if (step === "results" && isLoadingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-6">
        <ThemeToggle />
        <div className="max-w-md w-full text-center space-y-6">
          <p className="text-xl text-gray-700 dark:text-gray-300">Carregando resultado do seu teste...</p>
        </div>
      </div>
    );
  }

  // Tela Inicial - VERSÃO MELHORADA
  if (step === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn">
        <ThemeToggle />
        {/* Botão Início no topo esquerdo */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
          <button
            onClick={() => {
              if (user) {
                router.push("/home");
              } else {
                router.push("/auth/login?redirect=/home");
              }
            }}
            className="text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1 group"
          >
            <span>Início</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Botão de perfil (se logado) */}
        {user && (
          <div className="absolute top-4 sm:top-6 right-16 sm:right-20 z-10">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A9CC6] dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-[#7A9CC6] dark:text-blue-400">Perfil</span>
            </Link>
          </div>
        )}

        <div className="max-w-lg w-full text-center space-y-6 sm:space-y-8">
          {/* Logo Real com animação de pulse suave */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative transform hover:scale-105 transition-transform duration-500 animate-pulse-slow">
              <Image
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/011de2a3-0a6d-44e7-8fd4-6d4fc406cc06.png"
                alt="RendEx Logo"
                width={160}
                height={160}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Título com hierarquia visual melhorada */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#7A9CC6] via-[#8A7CA8] to-[#F5C6C6] dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent leading-tight animate-gradient">
              RendEx
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#7A9CC6] dark:text-blue-400 leading-snug">
              Descubra sua renda extra ideal
            </p>
          </div>

          {/* Descrição com melhor legibilidade */}
          <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed px-2 sm:px-4 max-w-md mx-auto">
            Faça um teste rápido e descubra qual renda extra combina perfeitamente
            com seu perfil, tempo disponível e objetivos.
          </p>

          {/* Card informativo com glassmorphism */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-white/40 dark:border-gray-700/40 max-w-sm mx-auto">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 p-2.5 sm:p-3 rounded-xl shadow-md">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-[#7A9CC6] dark:text-blue-400">10</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">perguntas</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-[#F5C6C6] to-[#8A7CA8] dark:from-pink-500 dark:to-purple-500 p-2.5 sm:p-3 rounded-xl shadow-md">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-[#F5C6C6] dark:text-pink-400">3</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">minutos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Frase motivacional */}
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-[#8A7CA8] dark:text-purple-400 font-medium">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>100% gratuito e personalizado</span>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3 sm:space-y-4">
            {/* Botão Começar agora */}
            <button
              onClick={() => setStep("quiz")}
              className="group relative w-full max-w-xs mx-auto py-3.5 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-[#7A9CC6] via-[#8A7CA8] to-[#F5C6C6] dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 text-white text-base sm:text-lg font-semibold rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              {/* Efeito de brilho animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <span className="relative flex items-center justify-center gap-2">
                Começar agora
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>

            {/* Botão Entrar */}
            <button
              onClick={handleEntrar}
              className="group relative w-full max-w-xs mx-auto py-3 sm:py-3.5 px-6 sm:px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-[#7A9CC6] dark:text-blue-400 text-base sm:text-lg font-semibold rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-[#7A9CC6]/30 dark:border-blue-500/30 hover:border-[#7A9CC6] dark:hover:border-blue-500"
            >
              <span className="relative flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5 sm:w-5 sm:h-5" />
                {user ? "Ir para o início" : "Entrar"}
              </span>
            </button>
          </div>

          {/* Texto de confiança */}
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
            Mais de 1.000 pessoas já descobriram sua RendEx ideal
          </p>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.85;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Tela de Feedback (transição entre perguntas) - COM BOTÃO PRÓXIMO
  if (step === "feedback") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-6">
        <ThemeToggle />
        <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
          {/* Feedback emocional */}
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/40 dark:border-gray-700/40">
            <p className="text-xl md:text-2xl font-medium text-[#7A9CC6] dark:text-blue-400 leading-relaxed mb-6">
              {currentFeedback}
            </p>
            
            {/* Botão Próximo - discreto no canto inferior direito */}
            <div className="flex justify-end">
              <button
                onClick={handleAvancarManual}
                className="group flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 transition-all duration-300 hover:scale-105"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
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
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-6">
        <ThemeToggle />
        <div className="max-w-md w-full text-center space-y-8">
          {/* Mensagens de loading */}
          <div className="space-y-4">
            <div className="h-2 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] dark:from-blue-500 dark:to-pink-500 animate-loading"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400">
              Analisando suas respostas
            </h2>
            
            <p className="text-lg text-gray-700 dark:text-gray-300">
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
    const currentQ = questions[currentQuestion];
    const currentAnswer = answers.find((a) => a.question === currentQuestion + 1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4 sm:p-6">
        <ThemeToggle />
        <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
          {/* Progresso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="font-semibold text-[#7A9CC6] dark:text-blue-400">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#7A9CC6] to-[#F5C6C6] dark:from-blue-500 dark:to-pink-500 transition-all duration-500 ease-out"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Card da pergunta */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 dark:border-gray-700/40 animate-slideIn">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-6 sm:mb-8 leading-tight">
              {currentQ.question}
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {currentQ.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`
                    w-full text-left p-4 sm:p-5 rounded-2xl font-medium text-base sm:text-lg
                    transition-all duration-300 transform hover:scale-[1.02]
                    ${
                      currentAnswer?.answer === option.value
                        ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 text-white shadow-lg"
                        : "bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 shadow-md hover:shadow-lg"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Voltar */}
          {currentQuestion > 0 && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 font-medium transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          )}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideIn {
            animation: slideIn 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Tela de Resultados - ESTILO ORIGINAL RESTAURADO
  if (step === "results" && userProfile && rendexRecomendadas.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 md:p-8">
        <ThemeToggle />
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#7A9CC6] via-[#8A7CA8] to-[#F5C6C6] dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Seu Perfil RendEx
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-[#7A9CC6] dark:text-blue-400">
              {userProfile.title}
            </p>
          </div>

          {/* Descrição do Perfil */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {userProfile.description}
            </p>
          </div>

          {/* Pontos Fortes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-4">
              Seus Pontos Fortes
            </h2>
            <ul className="space-y-2">
              {userProfile.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#7A9CC6] dark:text-blue-400 mt-1">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trava Principal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-[#F5C6C6] dark:text-pink-400 mb-3">
              Sua Trava Principal: {userProfile.mainBlock}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {userProfile.mainBlockDescription}
            </p>
          </div>

          {/* O Que Você Busca */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-[#8A7CA8] dark:text-purple-400 mb-3">
              O Que Você Busca: {userProfile.seeking}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {userProfile.seekingDescription}
            </p>
          </div>

          {/* Mensagem Final */}
          <div className="bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 rounded-2xl p-6 shadow-md">
            <p className="text-white leading-relaxed">
              {userProfile.finalMessage}
            </p>
          </div>

          {/* Recomendações de RendEx - ESTILO ORIGINAL */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#7A9CC6] dark:text-blue-400">
              Suas 3 Recomendações de RendEx
            </h2>
            
            <div className="space-y-4">
              {rendexRecomendadas.slice(0, 3).map((rendex, index) => (
                <div
                  key={rendex.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {rendex.nome}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {rendex.descricao_curta}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedIdea(rendex);
                      setShowDetails(true);
                    }}
                    className="w-full py-2 px-4 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Ver detalhes
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleRefazerQuiz}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-[#7A9CC6] dark:text-blue-400 font-semibold rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-[#7A9CC6]/30 dark:border-blue-500/30"
            >
              Refazer teste
            </button>
            
            {user && (
              <button
                onClick={handleIrParaInicio}
                className="px-6 py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-500 dark:to-purple-500 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Ir para o início
              </button>
            )}
          </div>
        </div>

        {/* Modal de Detalhes da RendEx */}
        {showDetails && selectedIdea && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400">
                  {selectedIdea.nome}
                </h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedIdea(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedIdea.descricao_curta}
                </p>

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-1">Primeiro Passo:</span>
                    <p className="text-gray-800 dark:text-gray-200">{selectedIdea.primeiro_passo}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-1">Teste 24h:</span>
                    <p className="text-gray-800 dark:text-gray-200">{selectedIdea.teste_24h}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Investimento:</span>
                    <p className="text-gray-800 dark:text-gray-200">R$ {selectedIdea.investimento_inicial}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Tempo Início:</span>
                    <p className="text-gray-800 dark:text-gray-200">{selectedIdea.tempo_inicio}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Complexidade:</span>
                    <p className="text-gray-800 dark:text-gray-200">{selectedIdea.complexidade}/10</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Categoria:</span>
                    <p className="text-gray-800 dark:text-gray-200">{selectedIdea.categoria}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Ganho Inicial Estimado:</span>
                      <p className="text-gray-800 dark:text-gray-200">{selectedIdea.ganho_inicial_estimado}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Ganho em 3 Meses:</span>
                      <p className="text-gray-800 dark:text-gray-200">{selectedIdea.ganho_3meses_estimado}</p>
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

  // Fallback final
  return null;
}

export default function RendExApp() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RendExAppContent />
    </Suspense>
  );
}
