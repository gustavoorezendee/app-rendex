"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Heart,
  Users,
  Grid3x3,
  Calculator,
  Crown,
  Headphones,
  Target,
  Package,
  TrendingUp,
  Lock,
  User
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { JornadaRendEx } from "@/components/JornadaRendEx";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [isPremium, setIsPremium] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/home");
    }
  }, [user, loading, router]);

  // Buscar username e plano do Supabase
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, plano")
          .eq("user_id", user.id)
          .single();

        if (data) {
          if (data.username) {
            setUserName(data.username);
          } else {
            setUserName(user.email?.split("@")[0] || "Usuário");
          }
          setIsPremium(data.plano === "premium");
        } else {
          setUserName(user.email?.split("@")[0] || "Usuário");
        }
      }
    };
    loadUserData();
  }, [user]);

  // Função para refazer quiz
  const handleRefazerQuiz = () => {
    // Setar estado temporário no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("refazendo_quiz", "true");
    }
    // Redirecionar para a página inicial do quiz
    router.push("/");
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6] dark:border-blue-500 transition-colors duration-300"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 transition-colors duration-300">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não estiver autenticado (vai redirecionar)
  if (!user) {
    return null;
  }

  // Cards do Modo Negócio RendEx (sempre visíveis no topo)
  const modoNegocioCards = [
    {
      icon: Calculator,
      title: "Calculadora de preço",
      description: "Descubra quanto cobrar pelos seus produtos ou serviços",
      href: "/calculadora",
      gradient: "from-[#A8D5BA] to-[#7AC69C] dark:from-emerald-600 dark:to-teal-600",
      locked: false,
    },
    {
      icon: Package,
      title: "Catálogo pessoal",
      description: "Gerencie seus produtos e serviços salvos",
      href: "/catalogo-pessoal",
      gradient: "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
      locked: !isPremium,
    },
    {
      icon: TrendingUp,
      title: "Meu Negócio",
      description: "Painel de decisão com insights e análises",
      href: "/meu-negocio",
      gradient: "from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700",
      locked: !isPremium,
    },
  ];

  // Cards gerais (abaixo do Modo Negócio)
  const cards = [
    {
      icon: Target,
      title: "Trilha RendEx",
      description: "Jornada de 360 dias com missões diárias para multiplicar sua renda",
      href: "/trilha",
      gradient: "from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700",
    },
    {
      icon: RefreshCw,
      title: "Refazer quiz",
      description: "Responder tudo de novo para atualizar suas recomendações",
      onClick: handleRefazerQuiz, // Usar função em vez de href
      gradient: "from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600",
    },
    {
      icon: Heart,
      title: "Minhas RendEx",
      description: "Ver as 3 RendEx mais compatíveis com o seu perfil",
      href: "/minhas-rendex",
      gradient: "from-[#F5C6C6] to-[#E8A5A5] dark:from-pink-600 dark:to-rose-600",
    },
    {
      icon: Crown,
      title: "Meu Plano",
      description: "Gerencie seu plano e acesse recursos Premium",
      href: "/plano",
      gradient: "from-amber-400 to-orange-500 dark:from-amber-600 dark:to-orange-600",
    },
    {
      icon: Users,
      title: "Indicações",
      description: "Indique amigos e ganhe benefícios no Premium",
      href: "/indicacoes",
      gradient: "from-[#8A7CA8] to-[#A89CC6] dark:from-purple-600 dark:to-indigo-600",
    },
    {
      icon: Grid3x3,
      title: "Explorar todas as RendEx",
      description: "Veja todas as oportunidades disponíveis no catálogo",
      href: "/catalogo",
      gradient: "from-[#7A9CC6] to-[#F5C6C6] dark:from-blue-600 dark:to-pink-600",
    },
    {
      icon: Headphones,
      title: "Suporte e Feedback",
      description: "Envie sugestões, reporte problemas ou fale com o suporte",
      href: "/suporte",
      gradient: "from-[#A8D5BA] to-[#7A9CC6] dark:from-teal-600 dark:to-blue-600",
    },
    {
      icon: User,
      title: "Meu Perfil",
      description: "Veja seu perfil, dados do quiz e histórico",
      href: "/profile",
      gradient: "from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      {/* Botão de tema */}
      <ThemeToggle />
      
      <div className="max-w-6xl mx-auto">
        {/* Header com boas-vindas */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3 transition-colors duration-300">
            Olá, {userName || "Usuário"}! 👋
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Escolha o próximo passo da sua RendEx
          </p>
        </div>

        {/* BLOCO JORNADA RENDEX - NOVO */}
        <JornadaRendEx userId={user.id} />

        {/* MODO NEGÓCIO RENDEX - Seção destacada */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
              💼 Modo Negócio RendEx
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ferramentas para donos de pequenos negócios e autônomos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {modoNegocioCards.map((card) => {
              const Icon = card.icon;
              
              if (card.locked) {
                // Card bloqueado (premium)
                return (
                  <div
                    key={card.title}
                    className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <div className="flex flex-col items-center text-center space-y-4 opacity-60">
                      {/* Ícone com gradiente */}
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center relative`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                        <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Título */}
                      <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                        {card.title}
                      </h2>

                      {/* Descrição */}
                      <p className="text-gray-500 dark:text-gray-500 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Badge Premium */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </div>
                    </div>

                    {/* Botão para virar premium */}
                    <Link
                      href="/plano"
                      className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Crown className="w-5 h-5" />
                      Desbloquear Premium
                    </Link>
                  </div>
                );
              }

              // Card desbloqueado
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Ícone com gradiente */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Título */}
                    <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 transition-colors duration-300">
                      {card.title}
                    </h2>

                    {/* Descrição */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Divisor visual */}
        <div className="flex items-center gap-4 mb-12 max-w-4xl mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Outras ferramentas</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
        </div>

        {/* Grid de cards gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;

            // Se o card tem onClick, renderizar como button
            if (card.onClick) {
              return (
                <button
                  key={card.title}
                  onClick={card.onClick}
                  className="group bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Ícone com gradiente */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Título */}
                    <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 transition-colors duration-300">
                      {card.title}
                    </h2>

                    {/* Descrição */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                      {card.description}
                    </p>
                  </div>
                </button>
              );
            }

            // Caso contrário, renderizar como Link
            return (
              <Link
                key={card.title}
                href={card.href || "#"}
                className="group bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Ícone com gradiente */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Título */}
                  <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 transition-colors duration-300">
                    {card.title}
                  </h2>

                  {/* Descrição */}
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
