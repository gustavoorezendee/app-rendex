"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Gift, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function IndicacoesPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/indicacoes");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7A9CC6] to-[#F5C6C6] dark:from-blue-600 dark:to-pink-600 flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
            Indicações
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Indique amigos e ganhe benefícios exclusivos
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl space-y-8">
          {/* Ícone central */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F5C6C6] to-[#8A7CA8] dark:from-pink-600 dark:to-purple-600 flex items-center justify-center animate-pulse">
                <Gift className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-[#F5C6C6] dark:text-pink-400" />
              </div>
            </div>
          </div>

          {/* Mensagem principal */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[#7A9CC6] dark:text-blue-400">
              Em breve você vai poder indicar amigos
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Estamos preparando um programa de indicações incrível onde você poderá
              convidar seus amigos e ganhar dias de acesso ao Premium para cada pessoa
              que se cadastrar através do seu link.
            </p>
          </div>

          {/* Benefícios futuros */}
          <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-pink-900/30 rounded-2xl p-8 space-y-4">
            <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400 text-center mb-6">
              O que você vai ganhar:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-[#F5C6C6] dark:text-pink-400 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Dias de Premium grátis</strong> para cada amigo que se cadastrar
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#F5C6C6] dark:text-pink-400 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Acesso antecipado</strong> a novas RendEx exclusivas
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#F5C6C6] dark:text-pink-400 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Bônus especiais</strong> quando seus amigos alcançarem metas
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#F5C6C6] dark:text-pink-400 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Comunidade exclusiva</strong> de membros que mais indicam
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center pt-6">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Fique ligado! Vamos avisar você assim que o programa estiver disponível.
            </p>
            <Link
              href="/home"
              className="inline-block py-3 px-8 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
