"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserPlano } from '@/lib/supabase';
import { Crown, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PlanoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAtivarPremium = async () => {
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      const result = await updateUserPlano(user.id, 'premium');

      if (result) {
        setMessage({ type: 'success', text: 'Plano Premium ativado com sucesso!' });
        await refreshProfile();
      } else {
        setMessage({ type: 'error', text: 'Erro ao ativar plano Premium. Tente novamente.' });
      }
    } catch (error) {
      console.error('Erro ao ativar premium:', error);
      setMessage({ type: 'error', text: 'Erro inesperado ao ativar plano Premium.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDesativarPremium = async () => {
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      const result = await updateUserPlano(user.id, 'free');

      if (result) {
        setMessage({ type: 'success', text: 'Plano alterado para Free.' });
        await refreshProfile();
      } else {
        setMessage({ type: 'error', text: 'Erro ao alterar plano. Tente novamente.' });
      }
    } catch (error) {
      console.error('Erro ao desativar premium:', error);
      setMessage({ type: 'error', text: 'Erro inesperado ao alterar plano.' });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#7A9CC6] dark:text-blue-500 mx-auto mb-4 transition-colors duration-300" />
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login?redirect=/plano');
    return null;
  }

  const isPremium = profile?.plano === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para home
          </button>
          <h1 className="text-4xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2 transition-colors duration-300">
            Meu Plano
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Gerencie seu plano e acesse recursos exclusivos
          </p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 transition-colors duration-300 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            <p>{message.text}</p>
          </div>
        )}

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plano Free */}
          <div
            className={`bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 ${
              !isPremium
                ? 'border-[#7A9CC6] dark:border-blue-500 shadow-lg'
                : 'border-gray-200 dark:border-slate-700'
            }`}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2 transition-colors duration-300">
                Plano Free
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Acesso básico ao RendEx
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                R$ 0
                <span className="text-lg font-normal text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  /mês
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Quiz de perfil RendEx</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>3 recomendações personalizadas</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Informações básicas de cada RendEx</span>
              </li>
            </ul>

            {!isPremium && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg text-center font-medium transition-colors duration-300">
                Plano Atual
              </div>
            )}
          </div>

          {/* Plano Premium */}
          <div
            className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 transition-all duration-300 ${
              isPremium
                ? 'border-amber-500 shadow-lg'
                : 'border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  Plano Premium
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Acesso completo e ilimitado
              </p>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                R$ 49
                <span className="text-lg font-normal text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  /mês
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Tudo do plano Free, mais:</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Guias completos passo a passo</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Estratégias avançadas de monetização</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Acesso a todos os RendEx do catálogo</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            {isPremium ? (
              <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 px-4 py-2 rounded-lg text-center font-medium mb-3 transition-colors duration-300">
                Plano Atual
              </div>
            ) : null}

            {/* Botões de ação */}
            <div className="space-y-2">
              {!isPremium ? (
                <button
                  onClick={handleAtivarPremium}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      Ativar Premium (Teste)
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDesativarPremium}
                  disabled={updating}
                  className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Voltar para Free'
                  )}
                </button>
              )}
            </div>

            {!isPremium && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 transition-colors duration-300">
                * Modo de teste - sem cobrança real
              </p>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 transition-colors duration-300">
            ℹ️ Modo de Teste
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm transition-colors duration-300">
            Esta é uma página de testes para desenvolvimento. Você pode alternar entre os planos
            Free e Premium livremente para testar as funcionalidades do sistema. Nenhuma cobrança
            real será realizada.
          </p>
        </div>
      </div>
    </div>
  );
}
