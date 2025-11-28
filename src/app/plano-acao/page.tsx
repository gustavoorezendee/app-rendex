"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, type RendexCatalogo } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PlanoAcaoPremium } from "@/components/PlanoAcaoPremium";
import { ArrowLeft } from "lucide-react";

function PlanoAcaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const [rendex, setRendex] = useState<RendexCatalogo | null>(null);
  const [loading, setLoading] = useState(true);

  const rendexId = searchParams.get("id");
  const rendexNome = searchParams.get("nome");

  const isPremium = profile?.plano === "premium";

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/plano-acao");
      return;
    }

    if (!rendexId) {
      router.push("/catalogo");
      return;
    }

    // Buscar dados completos da RendEx
    const fetchRendex = async () => {
      try {
        const { data, error } = await supabase
          .from("rendex_catalogo")
          .select("*")
          .eq("id", rendexId)
          .single();

        if (error) {
          console.error("Erro ao buscar RendEx:", error);
          router.push("/catalogo");
        } else {
          setRendex(data);
        }
      } catch (error) {
        console.error("Erro ao buscar RendEx:", error);
        router.push("/catalogo");
      } finally {
        setLoading(false);
      }
    };

    fetchRendex();
  }, [user, rendexId, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
          <p className="mt-4 text-gray-600">Carregando plano de ação...</p>
        </div>
      </div>
    );
  }

  if (!rendex) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8]">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-[#7A9CC6]" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#7A9CC6]">
                {rendexNome || rendex.nome}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Plano de ação completo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PlanoAcaoPremium rendex={rendex} isPremium={isPremium} />
      </div>
    </div>
  );
}

export default function PlanoAcaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
            <p className="mt-4 text-gray-600">Carregando plano de ação...</p>
          </div>
        </div>
      }
    >
      <PlanoAcaoContent />
    </Suspense>
  );
}
