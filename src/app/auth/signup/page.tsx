"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validações
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password);

      if (error) {
        setError(error.message || "Erro ao criar conta. Tente novamente.");
        setLoading(false);
      } else {
        // Sucesso - mostrar mensagem de confirmação
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  // Tela de sucesso após cadastro
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="max-w-md w-full">
          <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center space-y-6 transition-colors duration-300">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-[#7A9CC6] dark:text-blue-400 transition-colors duration-300">
              Cadastro criado!
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-4 rounded-xl text-sm transition-colors duration-300">
              <p className="font-semibold mb-2">📧 Confirme seu e-mail</p>
              <p>
                Enviamos um link de confirmação para <strong>{email}</strong>.
                Confirme o e-mail para poder fazer login.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
              Verifique sua caixa de entrada (e também a pasta de spam).
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Card de Cadastro */}
        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2 transition-colors duration-300">
              Criar conta
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Cadastre-se para salvar suas Rendex favoritas
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
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
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#7A9CC6]/20 dark:focus:ring-blue-500/20 outline-none transition-all duration-300"
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm transition-colors duration-300">
                {error}
              </div>
            )}

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Já tem uma conta?{" "}
              <Link
                href={`/auth/login${redirectTo !== "/home" ? `?redirect=${redirectTo}` : ""}`}
                className="text-[#7A9CC6] dark:text-blue-400 hover:text-[#8A7CA8] dark:hover:text-blue-300 font-semibold transition-colors duration-300"
              >
                Entrar
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-[#7A9CC6] dark:text-blue-400 text-lg transition-colors duration-300">Carregando...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
