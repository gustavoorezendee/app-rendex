"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, Mail, Edit2, Check, X, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RendexProfile } from "@/components/RendexProfile";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Carregar username atual do usuário
  useEffect(() => {
    const loadUsername = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .single();

        if (data && data.username) {
          setCurrentUsername(data.username);
          setUsername(data.username);
        } else if (error) {
          console.error("Erro ao carregar username:", error);
        }
      }
    };
    loadUsername();
  }, [user]);

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      setUsernameError("O nome de usuário não pode estar vazio");
      return;
    }

    if (username.length < 3) {
      setUsernameError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    if (username.length > 30) {
      setUsernameError("O nome de usuário deve ter no máximo 30 caracteres");
      return;
    }

    setSavingUsername(true);
    setUsernameError("");
    setUsernameSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: username.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user?.id);

      if (error) {
        // Verifica se o erro é de username duplicado
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          setUsernameError("Este nome de usuário já está em uso. Por favor, escolha outro nome.");
        } else {
          setUsernameError("Erro ao salvar nome de usuário. Tente novamente.");
        }
        console.error("Erro ao atualizar username:", error);
      } else {
        setCurrentUsername(username.trim());
        setIsEditingUsername(false);
        setUsernameSuccess(true);
        setTimeout(() => setUsernameSuccess(false), 3000);
      }
    } catch (error) {
      setUsernameError("Erro ao salvar nome de usuário. Tente novamente.");
      console.error("Erro ao atualizar username:", error);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(currentUsername);
    setIsEditingUsername(false);
    setUsernameError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6] dark:border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/011de2a3-0a6d-44e7-8fd4-6d4fc406cc06.png"
              alt="RendEx Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain drop-shadow-2xl hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </div>

        {/* Mensagem de sucesso */}
        {usernameSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-center transition-colors duration-300">
            Nome de usuário atualizado com sucesso!
          </div>
        )}

        {/* Card de Perfil */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 rounded-full mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
              Meu Perfil
            </h1>
          </div>

          {/* Informações do usuário */}
          <div className="space-y-4 mb-8">
            {/* Username editável */}
            <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-pink-900/30 p-4 rounded-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <User className="w-5 h-5 text-[#7A9CC6] dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nome de usuário</p>
                    {isEditingUsername ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
                          placeholder="Digite seu nome de usuário"
                          maxLength={30}
                        />
                        {usernameError && (
                          <p className="text-xs text-red-600 dark:text-red-400">{usernameError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveUsername}
                            disabled={savingUsername}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                            {savingUsername ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingUsername}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {currentUsername || "Não definido"}
                      </p>
                    )}
                  </div>
                </div>
                {!isEditingUsername && (
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors duration-300"
                    title="Editar nome de usuário"
                  >
                    <Edit2 className="w-5 h-5 text-[#7A9CC6] dark:text-blue-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#FFE8E8] to-[#F5C6C6]/30 dark:from-pink-900/30 dark:to-rose-900/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#7A9CC6] dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#D6EAF8] to-[#FFE8E8] dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#7A9CC6] dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conta criada em</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
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
              href="/home"
              className="block w-full py-3 text-center bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Voltar para o início
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              Sair da conta
            </button>
          </div>
        </div>

        {/* Perfil RendEx - Trilha */}
        <RendexProfile userId={user.id} />

        {/* Link para a Trilha */}
        <Link
          href="/trilha"
          className="block bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 p-4 rounded-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-1">
                Acessar Trilha RendEx
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Continue sua jornada de 360 dias rumo à multiplicação de renda
              </p>
            </div>
          </div>
        </Link>

        {/* Informações adicionais */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sua conta está ativa e você pode acessar todas as Rendex personalizadas.
          </p>
        </div>
      </div>
    </div>
  );
}
