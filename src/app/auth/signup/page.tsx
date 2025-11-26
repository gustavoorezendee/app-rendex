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
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#7A9CC6]">
              Cadastro criado!
            </h2>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-xl text-sm">
              <p className="font-semibold mb-2">📧 Confirme seu e-mail</p>
              <p>
                Enviamos um link de confirmação para <strong>{email}</strong>.
                Confirme o e-mail para poder fazer login.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              Verifique sua caixa de entrada (e também a pasta de spam).
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#7A9CC6] mb-2">
              Criar conta
            </h1>
            <p className="text-gray-600">
              Cadastre-se para salvar suas Rendex favoritas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#7A9CC6] focus:ring-2 focus:ring-[#7A9CC6]/20 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:border-[#7A9CC6] focus:ring-2 focus:ring-[#7A9CC6]/20 outline-none transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:border-[#7A9CC6] focus:ring-2 focus:ring-[#7A9CC6]/20 outline-none transition-all"
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href={`/auth/login${redirectTo !== "/home" ? `?redirect=${redirectTo}` : ""}`}
                className="text-[#7A9CC6] hover:text-[#8A7CA8] font-semibold transition-colors"
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
            className="text-gray-600 hover:text-[#7A9CC6] transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex items-center justify-center">
        <div className="text-[#7A9CC6] text-lg">Carregando...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
