"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RefreshCw, Heart, Users, Grid3x3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Extrair nome do e-mail (parte antes do @)
  const userName = user?.email?.split("@")[0] || "Usuário";

  const cards = [
    {
      icon: RefreshCw,
      title: "Refazer quiz",
      description: "Responder tudo de novo para atualizar suas recomendações",
      href: "/",
      gradient: "from-[#7A9CC6] to-[#8A7CA8]",
    },
    {
      icon: Heart,
      title: "Minhas RendEx",
      description: "Ver as 3 RendEx mais compatíveis com o seu perfil",
      href: "/minhas-rendex",
      gradient: "from-[#F5C6C6] to-[#E8A5A5]",
    },
    {
      icon: Users,
      title: "Indicações",
      description: "Indique amigos e ganhe benefícios no Premium",
      href: "/indicacoes",
      gradient: "from-[#8A7CA8] to-[#A89CC6]",
    },
    {
      icon: Grid3x3,
      title: "Explorar todas as RendEx",
      description: "Veja todas as oportunidades disponíveis no catálogo",
      href: "/catalogo",
      gradient: "from-[#7A9CC6] to-[#F5C6C6]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header com boas-vindas */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6] mb-3">
            Olá, {userName}! 👋
          </h1>
          <p className="text-xl text-gray-700">
            Escolha o próximo passo da sua RendEx
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Ícone com gradiente */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Título */}
                  <h2 className="text-2xl font-bold text-[#7A9CC6]">
                    {card.title}
                  </h2>

                  {/* Descrição */}
                  <p className="text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Link para perfil */}
        <div className="text-center mt-12">
          <Link
            href="/profile"
            className="text-gray-600 hover:text-[#7A9CC6] transition-colors font-medium"
          >
            Ver meu perfil →
          </Link>
        </div>
      </div>
    </div>
  );
}
