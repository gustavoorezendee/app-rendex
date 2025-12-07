"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        // Tratamento específico para email não confirmado
        if (error.message?.toLowerCase().includes("email not confirmed") || 
            error.message?.toLowerCase().includes("email confirmation")) {
          setError("Você precisa confirmar seu e-mail antes de entrar. Verifique sua caixa de entrada.");
        } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
          setError("E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.");
        } else {
          setError(error.message || "E-mail ou senha incorretos");
        }
        setLoading(false);
      } else {
        // Sucesso - redirecionar usando window.location para garantir navegação
        console.log("Login bem-sucedido! Redirecionando para:", redirectTo);
        setLoading(false);
        
        // Usar window.location.href para garantir navegação completa
        window.location.href = redirectTo;
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message || "Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/011de2a3-0a6d-44e7-8fd4-6d4fc406cc06.png"
              alt="RendEx Logo"
              width={96}
              height={96}
              className="w-24 h-24 object-contain drop-shadow-2xl hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </div>

        {/* Card de Login */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2 transition-colors duration-300">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Entre para acessar suas Rendex personalizadas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Link de recuperação */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 transition-colors duration-300"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm transition-colors duration-300">
                {error}
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Link para cadastro */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Não tem uma conta?{" "}
              <Link
                href={`/auth/signup${redirectTo !== "/home" ? `?redirect=${redirectTo}` : ""}`}
                className="text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 font-semibold transition-colors duration-300"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Voltar */}
        <div className="text-center">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors duration-300"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-[#7A9CC6] dark:text-blue-400 text-lg transition-colors duration-300">Carregando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
