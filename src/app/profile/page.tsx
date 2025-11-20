"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, Mail } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6]"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-6">
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/8d4b8059-8f15-4ced-b8d8-4b58abc5be56.png"
              alt="RendEx Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain drop-shadow-2xl hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </div>

        {/* Card de Perfil */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] rounded-full mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#7A9CC6] mb-2">
              Meu Perfil
            </h1>
          </div>

          {/* Informações do usuário */}
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#7A9CC6]" />
                <div>
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#7A9CC6]" />
                <div>
                  <p className="text-sm text-gray-600">Conta criada em</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(user.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full py-3 text-center bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Voltar para o início
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              Sair da conta
            </button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-gray-600 text-sm">
            Sua conta está ativa e você pode acessar todas as Rendex personalizadas.
          </p>
        </div>
      </div>
    </div>
  );
}
