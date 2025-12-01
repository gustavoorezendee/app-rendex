"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Clock, MessageCircle } from "lucide-react";
import { useEffect } from "react";

export default function ContatoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/suporte/contato");
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Botão voltar */}
        <div className="mb-8 mt-4">
          <Link
            href="/suporte"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Suporte
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#A8D5BA] to-[#7AC69C] dark:from-emerald-600 dark:to-teal-600 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3 transition-colors duration-300">
            Falar com o Suporte
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Nossa equipe está pronta para ajudar você!
          </p>
        </div>

        {/* Card de contato por e-mail */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#A8D5BA] to-[#7AC69C] dark:from-emerald-600 dark:to-teal-600 rounded-full">
              <Mail className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                E-mail de Suporte
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Entre em contato diretamente com nossa equipe
              </p>
              <a
                href="mailto:suporte@rendexapp.com.br"
                className="inline-flex items-center gap-2 text-xl font-semibold text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-purple-400 transition-colors duration-300"
              >
                <Mail className="w-6 h-6" />
                suporte@rendexapp.com.br
              </a>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <a
                href="mailto:suporte@rendexapp.com.br?subject=Suporte RendEx&body=Olá, preciso de ajuda com..."
                className="w-full inline-block py-4 bg-gradient-to-r from-[#A8D5BA] to-[#7AC69C] dark:from-emerald-600 dark:to-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Enviar E-mail Agora
              </a>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Tempo de Resposta
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Respondemos em até 24 horas úteis
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F5C6C6] to-[#E8A5A5] dark:from-pink-600 dark:to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Suporte Dedicado
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipe especializada para ajudar você
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="mt-6 bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-pink-900/30 rounded-2xl p-6">
          <p className="text-center text-gray-700 dark:text-gray-300">
            <strong>Dica:</strong> Para um atendimento mais rápido, inclua detalhes sobre o problema ou dúvida no seu e-mail.
          </p>
        </div>
      </div>
    </div>
  );
}
