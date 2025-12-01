"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function SuportePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/suporte");
    }
  }, [user, loading, router]);

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

  const cards = [
    {
      icon: MessageSquare,
      title: "Enviar feedback",
      description: "Compartilhe suas sugestões e ideias para melhorar a RendEx",
      href: "/suporte/feedback",
      gradient: "from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600",
    },
    {
      icon: AlertCircle,
      title: "Reportar problema",
      description: "Encontrou um bug ou algo não está funcionando? Nos avise aqui",
      href: "/suporte/reportar",
      gradient: "from-[#F5C6C6] to-[#E8A5A5] dark:from-pink-600 dark:to-rose-600",
    },
    {
      icon: Mail,
      title: "Falar com o suporte",
      description: "Entre em contato direto com nossa equipe de suporte",
      href: "/suporte/contato",
      gradient: "from-[#A8D5BA] to-[#7AC69C] dark:from-emerald-600 dark:to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Botão voltar */}
        <div className="mb-8 mt-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para o início
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3 transition-colors duration-300">
            Suporte e Feedback
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 transition-colors duration-300 max-w-2xl mx-auto">
            Estamos aqui para ajudar! Envie suas sugestões, reporte problemas ou entre em contato com nossa equipe.
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
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
    </div>
  );
}
