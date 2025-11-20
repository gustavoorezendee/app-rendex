"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError("Erro ao enviar e-mail. Verifique o endereço e tente novamente.");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#7A9CC6]">
              E-mail enviado!
            </h2>
            <p className="text-gray-600">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Voltar para o login
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
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/8d4b8059-8f15-4ced-b8d8-4b58abc5be56.png"
              alt="RendEx Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain drop-shadow-2xl hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </div>

        {/* Card de Recuperação */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#7A9CC6] mb-2">
              Recuperar senha
            </h1>
            <p className="text-gray-600">
              Digite seu e-mail e enviaremos instruções para redefinir sua senha
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

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Enviando..." : "Enviar instruções"}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-[#7A9CC6] hover:text-[#8A7CA8] transition-colors"
            >
              ← Voltar para o login
            </Link>
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
