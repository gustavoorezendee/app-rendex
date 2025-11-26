"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Package, Briefcase, Plus, Trash2, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

type CalculatorType = "produto" | "servico";

interface CustoFixo {
  id: string;
  descricao: string;
  valor: number;
}

interface ProdutoData {
  // Passo 1
  materiaPrimaUnit: number;
  embalagemUnit: number;
  outrosVariaveisUnit: number;
  // Passo 2
  custosFixos: CustoFixo[];
  // Passo 3
  quantidadeMensalEstimativa: number;
  usarHoras: boolean;
  horasSemana: number;
  horasPorUnidade: number;
  // Passo 4
  taxaSobrePrecoPercent: number;
  margemPercentual: number;
  // Passo 5 - simulação
  quantidadeSimulacao: number;
}

interface ServicoData {
  // Passo 1
  horasPorAtendimento: number;
  valorHoraDesejado: number;
  // Passo 2
  custoDiretoAtendimento: number;
  // Passo 3
  custosFixos: CustoFixo[];
  horasMes: number;
  // Passo 4
  taxaSobrePrecoPercent: number;
  // Passo 5 (opcional)
  atendimentosPorMes: number;
  atendimentosSimulacao: number;
}

export default function CalculadoraPage() {
  const [type, setType] = useState<CalculatorType>("produto");
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para dados do produto
  const [produtoData, setProdutoData] = useState<ProdutoData>({
    materiaPrimaUnit: 0,
    embalagemUnit: 0,
    outrosVariaveisUnit: 0,
    custosFixos: [],
    quantidadeMensalEstimativa: 0,
    usarHoras: false,
    horasSemana: 0,
    horasPorUnidade: 0,
    taxaSobrePrecoPercent: 0,
    margemPercentual: 30,
    quantidadeSimulacao: 0,
  });

  // Estado para dados do serviço
  const [servicoData, setServicoData] = useState<ServicoData>({
    horasPorAtendimento: 0,
    valorHoraDesejado: 0,
    custoDiretoAtendimento: 0,
    custosFixos: [],
    horasMes: 0,
    taxaSobrePrecoPercent: 0,
    atendimentosPorMes: 0,
    atendimentosSimulacao: 0,
  });

  // Definir passos para cada tipo
  const produtoSteps = [
    { number: 1, title: "Custos por unidade" },
    { number: 2, title: "Custos fixos" },
    { number: 3, title: "Quantidade" },
    { number: 4, title: "Taxas e margem" },
    { number: 5, title: "Resultado" },
  ];

  const servicoSteps = [
    { number: 1, title: "Tempo e hora" },
    { number: 2, title: "Custos diretos" },
    { number: 3, title: "Custos fixos" },
    { number: 4, title: "Taxas" },
    { number: 5, title: "Resultado" },
  ];

  const steps = type === "produto" ? produtoSteps : servicoSteps;
  const totalSteps = steps.length;

  // Scroll suave para o topo ao mudar de passo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Scroll para resultados no passo 5
  useEffect(() => {
    if (currentStep === 5) {
      setTimeout(() => {
        const resultSection = document.getElementById("result-section");
        if (resultSection) {
          resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [currentStep]);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações por passo para produto
    if (type === "produto") {
      if (currentStep === 3) {
        if (!produtoData.usarHoras) {
          if (produtoData.quantidadeMensalEstimativa <= 0) {
            newErrors.quantidade = "Informe uma quantidade válida ou use a opção de calcular por horas.";
          }
        } else {
          if (produtoData.horasSemana <= 0) {
            newErrors.horasSemana = "Informe quantas horas por semana você vai dedicar.";
          }
          if (produtoData.horasPorUnidade <= 0) {
            newErrors.horasPorUnidade = "Informe quantas horas leva para produzir 1 unidade.";
          }
        }
      }

      if (currentStep === 4) {
        const taxaDecimal = produtoData.taxaSobrePrecoPercent / 100;
        const margemDecimal = produtoData.margemPercentual / 100;
        
        if (taxaDecimal + margemDecimal >= 1) {
          newErrors.taxaMargem = "A soma de taxa e margem não pode chegar a 100%. Ajuste os valores.";
        }
      }
    }

    // Validações por passo para serviço
    if (type === "servico") {
      if (currentStep === 1) {
        if (servicoData.horasPorAtendimento <= 0) {
          newErrors.horasAtendimento = "Informe quantas horas você gasta por atendimento.";
        }
        if (servicoData.valorHoraDesejado <= 0) {
          newErrors.valorHora = "Informe quanto você quer ganhar por hora.";
        }
      }

      if (currentStep === 3) {
        if (servicoData.horasMes <= 0) {
          newErrors.horasMes = "Informe quantas horas mensais você vai dedicar.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeChange = (newType: CalculatorType) => {
    setType(newType);
    setCurrentStep(1);
    setErrors({});
  };

  // Funções para gerenciar custos fixos (produto)
  const adicionarCustoFixoProduto = () => {
    setProdutoData({
      ...produtoData,
      custosFixos: [
        ...produtoData.custosFixos,
        { id: Date.now().toString(), descricao: "", valor: 0 },
      ],
    });
  };

  const removerCustoFixoProduto = (id: string) => {
    setProdutoData({
      ...produtoData,
      custosFixos: produtoData.custosFixos.filter((c) => c.id !== id),
    });
  };

  const atualizarCustoFixoProduto = (id: string, campo: "descricao" | "valor", valor: string | number) => {
    setProdutoData({
      ...produtoData,
      custosFixos: produtoData.custosFixos.map((c) =>
        c.id === id ? { ...c, [campo]: valor } : c
      ),
    });
  };

  // Funções para gerenciar custos fixos (serviço)
  const adicionarCustoFixoServico = () => {
    setServicoData({
      ...servicoData,
      custosFixos: [
        ...servicoData.custosFixos,
        { id: Date.now().toString(), descricao: "", valor: 0 },
      ],
    });
  };

  const removerCustoFixoServico = (id: string) => {
    setServicoData({
      ...servicoData,
      custosFixos: servicoData.custosFixos.filter((c) => c.id !== id),
    });
  };

  const atualizarCustoFixoServico = (id: string, campo: "descricao" | "valor", valor: string | number) => {
    setServicoData({
      ...servicoData,
      custosFixos: servicoData.custosFixos.map((c) =>
        c.id === id ? { ...c, [campo]: valor } : c
      ),
    });
  };

  // Cálculos para produto
  const calcularResultadoProduto = () => {
    const custoVariavelUnitario =
      (produtoData.materiaPrimaUnit || 0) +
      (produtoData.embalagemUnit || 0) +
      (produtoData.outrosVariaveisUnit || 0);

    const custoFixoMensal = produtoData.custosFixos.reduce(
      (acc, custo) => acc + (custo.valor || 0),
      0
    );

    let custoFixoPorUnidade = 0;
    let quantidadeUsada = 0;

    if (!produtoData.usarHoras) {
      quantidadeUsada = produtoData.quantidadeMensalEstimativa;
      custoFixoPorUnidade = quantidadeUsada > 0 ? custoFixoMensal / quantidadeUsada : 0;
    } else {
      const horasMes = produtoData.horasSemana * 4;
      const custoFixoPorHora = horasMes > 0 ? custoFixoMensal / horasMes : 0;
      custoFixoPorUnidade = custoFixoPorHora * produtoData.horasPorUnidade;
    }

    const custoUnitario = custoVariavelUnitario + custoFixoPorUnidade;

    const taxaSobrePrecoDecimal = produtoData.taxaSobrePrecoPercent / 100;
    const margemDecimal = produtoData.margemPercentual / 100;

    const precoIdeal = custoUnitario / (1 - taxaSobrePrecoDecimal - margemDecimal);
    const precoMinimo = custoUnitario / (1 - taxaSobrePrecoDecimal);
    const lucroUnitario = precoIdeal - (custoUnitario + taxaSobrePrecoDecimal * precoIdeal);
    
    let lucroMensalEstimado = null;
    if (quantidadeUsada > 0) {
      lucroMensalEstimado = lucroUnitario * quantidadeUsada;
    }

    // Simulação com quantidade diferente
    let lucroSimulacao = null;
    if (produtoData.quantidadeSimulacao > 0) {
      lucroSimulacao = lucroUnitario * produtoData.quantidadeSimulacao;
    }

    return {
      precoIdeal,
      precoMinimo,
      lucroUnitario,
      lucroMensalEstimado,
      lucroSimulacao,
      quantidadeUsada,
    };
  };

  // Cálculos para serviço
  const calcularResultadoServico = () => {
    const valorTempo = servicoData.valorHoraDesejado * servicoData.horasPorAtendimento;
    const custoDiretoAtendimento = servicoData.custoDiretoAtendimento || 0;

    const custoFixoMensal = servicoData.custosFixos.reduce(
      (acc, custo) => acc + (custo.valor || 0),
      0
    );
    const custoFixoPorHora = servicoData.horasMes > 0 ? custoFixoMensal / servicoData.horasMes : 0;
    const custoFixoPorAtendimento = custoFixoPorHora * servicoData.horasPorAtendimento;

    const precoBaseSemTaxa = valorTempo + custoDiretoAtendimento + custoFixoPorAtendimento;

    const taxaSobrePrecoDecimal = servicoData.taxaSobrePrecoPercent / 100;
    const precoIdeal = taxaSobrePrecoDecimal === 0 
      ? precoBaseSemTaxa 
      : precoBaseSemTaxa / (1 - taxaSobrePrecoDecimal);

    const valorRecebidoDepoisTaxas = precoIdeal * (1 - taxaSobrePrecoDecimal);
    const custoTotalAtendimento = custoDiretoAtendimento + custoFixoPorAtendimento;
    const lucroAtendimento = valorRecebidoDepoisTaxas - custoTotalAtendimento;

    let lucroMensalEstimado = null;
    if (servicoData.atendimentosPorMes > 0) {
      lucroMensalEstimado = lucroAtendimento * servicoData.atendimentosPorMes;
    }

    // Simulação com quantidade diferente
    let lucroSimulacao = null;
    if (servicoData.atendimentosSimulacao > 0) {
      lucroSimulacao = lucroAtendimento * servicoData.atendimentosSimulacao;
    }

    return {
      precoIdeal,
      valorTempo,
      custoTotalAtendimento,
      lucroAtendimento,
      lucroMensalEstimado,
      lucroSimulacao,
    };
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Renderizar conteúdo do passo atual para produto
  const renderProdutoStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Custos por unidade
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Informe os custos para produzir cada unidade
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custo de matéria-prima (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={produtoData.materiaPrimaUnit || ""}
                  onChange={(e) =>
                    setProdutoData({
                      ...produtoData,
                      materiaPrimaUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 5.50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: farinha, açúcar, tecido, componentes
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custo de embalagem (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={produtoData.embalagemUnit || ""}
                  onChange={(e) =>
                    setProdutoData({
                      ...produtoData,
                      embalagemUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 2.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: caixas, sacolas, etiquetas
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Outros custos (R$) - opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={produtoData.outrosVariaveisUnit || ""}
                  onChange={(e) =>
                    setProdutoData({
                      ...produtoData,
                      outrosVariaveisUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 1.50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: entrega, comissão, taxa de plataforma
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Custos fixos mensais
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Adicione custos fixos relacionados a essa renda
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ex: aluguel, apps, energia, marketing
              </p>
            </div>

            <div className="space-y-4">
              {produtoData.custosFixos.map((custo) => (
                <div key={custo.id} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={custo.descricao}
                      onChange={(e) =>
                        atualizarCustoFixoProduto(custo.id, "descricao", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                      placeholder="Descrição do custo"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custo.valor || ""}
                      onChange={(e) =>
                        atualizarCustoFixoProduto(custo.id, "valor", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                      placeholder="Valor mensal (R$)"
                    />
                  </div>
                  <button
                    onClick={() => removerCustoFixoProduto(custo.id)}
                    className="mt-1 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    aria-label="Remover custo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={adicionarCustoFixoProduto}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-[#7A9CC6] text-[#7A9CC6] hover:bg-[#7A9CC6] hover:text-white transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Adicionar custo fixo
              </button>

              {produtoData.custosFixos.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 mt-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Total de custos fixos:{" "}
                    <span className="text-[#7A9CC6] text-lg">
                      {formatarMoeda(
                        produtoData.custosFixos.reduce((acc, c) => acc + (c.valor || 0), 0)
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Quantidade ou horas
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Ajude-nos a calcular o custo fixo por unidade
              </p>
            </div>

            {!produtoData.usarHoras ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantas unidades por mês você pode produzir/vender?
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={produtoData.quantidadeMensalEstimativa || ""}
                    onChange={(e) =>
                      setProdutoData({
                        ...produtoData,
                        quantidadeMensalEstimativa: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                      errors.quantidade ? "border-red-300" : "border-gray-200"
                    } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                    placeholder="Ex: 50"
                  />
                  {errors.quantidade && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.quantidade}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    setProdutoData({ ...produtoData, usarHoras: true, quantidadeMensalEstimativa: 0 })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Não sei estimar isso
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horas por semana dedicadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={produtoData.horasSemana || ""}
                    onChange={(e) =>
                      setProdutoData({
                        ...produtoData,
                        horasSemana: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                      errors.horasSemana ? "border-red-300" : "border-gray-200"
                    } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                    placeholder="Ex: 10"
                  />
                  {errors.horasSemana && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.horasSemana}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horas para produzir 1 unidade
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={produtoData.horasPorUnidade || ""}
                    onChange={(e) =>
                      setProdutoData({
                        ...produtoData,
                        horasPorUnidade: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                      errors.horasPorUnidade ? "border-red-300" : "border-gray-200"
                    } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                    placeholder="Ex: 2.5"
                  />
                  {errors.horasPorUnidade && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.horasPorUnidade}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    setProdutoData({ ...produtoData, usarHoras: false, horasSemana: 0, horasPorUnidade: 0 })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Voltar para estimativa de quantidade
                </button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Taxas e margem
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Informe as taxas e a margem de lucro desejada
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taxas sobre o preço (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={produtoData.taxaSobrePrecoPercent || ""}
                  onChange={(e) =>
                    setProdutoData({
                      ...produtoData,
                      taxaSobrePrecoPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 5.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: maquininha (3%), marketplace (10%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Margem de lucro desejada (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={produtoData.margemPercentual || ""}
                  onChange={(e) =>
                    setProdutoData({
                      ...produtoData,
                      margemPercentual: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugestão: 30% é uma margem comum
                </p>
              </div>

              {errors.taxaMargem && (
                <div className="bg-red-50 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errors.taxaMargem}</p>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  A soma de taxa e margem deve ser menor que 100%
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        const resultado = calcularResultadoProduto();
        return (
          <div className="space-y-6" id="result-section">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Resultado da Calculadora
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Valores calculados para o seu produto
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                  Preço mínimo
                </h3>
                <p className="text-4xl font-bold text-amber-900 mb-1">
                  {formatarMoeda(resultado.precoMinimo)}
                </p>
                <p className="text-xs text-amber-700">
                  Para não ter prejuízo
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">
                  Preço ideal
                </h3>
                <p className="text-4xl font-bold text-green-900 mb-1">
                  {formatarMoeda(resultado.precoIdeal)}
                </p>
                <p className="text-xs text-green-700">
                  Com margem de lucro
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                  Lucro por unidade
                </h3>
                <p className="text-4xl font-bold text-blue-900 mb-1">
                  {formatarMoeda(resultado.lucroUnitario)}
                </p>
                <p className="text-xs text-blue-700">
                  Em cada venda
                </p>
              </div>

              {resultado.lucroMensalEstimado !== null && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xs font-semibold text-purple-800 mb-2 uppercase tracking-wide">
                    Lucro mensal estimado
                  </h3>
                  <p className="text-4xl font-bold text-purple-900 mb-1">
                    {formatarMoeda(resultado.lucroMensalEstimado)}
                  </p>
                  <p className="text-xs text-purple-700">
                    Com {resultado.quantidadeUsada} unidades/mês
                  </p>
                </div>
              )}
            </div>

            {/* Simulação de lucro mensal */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                  Simule seu lucro mensal
                </h3>
              </div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E se você vender quantas unidades por mês?
              </label>
              <input
                type="number"
                min="0"
                value={produtoData.quantidadeSimulacao || ""}
                onChange={(e) =>
                  setProdutoData({
                    ...produtoData,
                    quantidadeSimulacao: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:outline-none transition-colors"
                placeholder="Ex: 100"
              />
              {resultado.lucroSimulacao !== null && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-700 mb-1">Seu lucro mensal seria:</p>
                  <p className="text-3xl font-bold text-indigo-900">
                    {formatarMoeda(resultado.lucroSimulacao)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                💡 <strong>Entenda os números:</strong> Com esse preço ideal, você cobre custos, 
                paga taxas e mantém sua margem de lucro. Se um concorrente cobra muito abaixo, 
                provavelmente está ganhando menos ou tendo prejuízo.
              </p>
            </div>

            <button
              onClick={() => {
                setCurrentStep(1);
                setProdutoData({
                  materiaPrimaUnit: 0,
                  embalagemUnit: 0,
                  outrosVariaveisUnit: 0,
                  custosFixos: [],
                  quantidadeMensalEstimativa: 0,
                  usarHoras: false,
                  horasSemana: 0,
                  horasPorUnidade: 0,
                  taxaSobrePrecoPercent: 0,
                  margemPercentual: 30,
                  quantidadeSimulacao: 0,
                });
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              Fazer novo cálculo
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizar conteúdo do passo atual para serviço
  const renderServicoStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Tempo e valor da hora
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Garanta que seu preço seja digno do seu trabalho
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Horas por atendimento
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={servicoData.horasPorAtendimento || ""}
                  onChange={(e) =>
                    setServicoData({
                      ...servicoData,
                      horasPorAtendimento: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                    errors.horasAtendimento ? "border-red-300" : "border-gray-200"
                  } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                  placeholder="Ex: 2.5"
                />
                {errors.horasAtendimento && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.horasAtendimento}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tempo total: preparação + execução + finalização
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor desejado por hora (R$)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={servicoData.valorHoraDesejado || ""}
                  onChange={(e) =>
                    setServicoData({
                      ...servicoData,
                      valorHoraDesejado: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                    errors.valorHora ? "border-red-300" : "border-gray-200"
                  } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                  placeholder="Ex: 50"
                />
                {errors.valorHora && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.valorHora}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Valor que faça valer seu tempo e esforço
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Definir um valor justo por hora garante que você seja bem remunerado
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Custos por atendimento
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Custos diretos que você tem a cada cliente
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custos diretos (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={servicoData.custoDiretoAtendimento || ""}
                  onChange={(e) =>
                    setServicoData({
                      ...servicoData,
                      custoDiretoAtendimento: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 15.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: materiais, deslocamento, estacionamento
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  💡 Sem custos diretos? Deixe em zero
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Custos fixos mensais
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Custos fixos relacionados a essa atividade
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ex: aluguel, apps, energia, marketing
              </p>
            </div>

            <div className="space-y-4">
              {servicoData.custosFixos.map((custo) => (
                <div key={custo.id} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={custo.descricao}
                      onChange={(e) =>
                        atualizarCustoFixoServico(custo.id, "descricao", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                      placeholder="Descrição do custo"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custo.valor || ""}
                      onChange={(e) =>
                        atualizarCustoFixoServico(custo.id, "valor", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                      placeholder="Valor mensal (R$)"
                    />
                  </div>
                  <button
                    onClick={() => removerCustoFixoServico(custo.id)}
                    className="mt-1 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    aria-label="Remover custo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={adicionarCustoFixoServico}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-[#7A9CC6] text-[#7A9CC6] hover:bg-[#7A9CC6] hover:text-white transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Adicionar custo fixo
              </button>

              {servicoData.custosFixos.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 mt-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Total de custos fixos:{" "}
                    <span className="text-[#7A9CC6] text-lg">
                      {formatarMoeda(
                        servicoData.custosFixos.reduce((acc, c) => acc + (c.valor || 0), 0)
                      )}
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Horas mensais dedicadas
                </label>
                <input
                  type="number"
                  min="1"
                  value={servicoData.horasMes || ""}
                  onChange={(e) =>
                    setServicoData({
                      ...servicoData,
                      horasMes: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                    errors.horasMes ? "border-red-300" : "border-gray-200"
                  } focus:border-[#7A9CC6] focus:outline-none transition-colors`}
                  placeholder="Ex: 40"
                />
                {errors.horasMes && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.horasMes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Para calcular custo fixo por atendimento
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Taxas
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Taxas que incidem sobre o preço do serviço
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taxas sobre o preço (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={servicoData.taxaSobrePrecoPercent || ""}
                  onChange={(e) =>
                    setServicoData({
                      ...servicoData,
                      taxaSobrePrecoPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-[#7A9CC6] focus:outline-none transition-colors"
                  placeholder="Ex: 3.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: maquininha, plataforma, imposto. Deixe 0 se não tiver
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  💡 Sem taxas? Deixe em zero
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        const resultado = calcularResultadoServico();
        return (
          <div className="space-y-6" id="result-section">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] mb-2">
                Resultado da Calculadora
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Valores calculados para o seu serviço
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">
                  Preço recomendado
                </h3>
                <p className="text-4xl font-bold text-green-900 mb-1">
                  {formatarMoeda(resultado.precoIdeal)}
                </p>
                <p className="text-xs text-green-700">
                  Por atendimento
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                  Seu ganho por hora
                </h3>
                <p className="text-4xl font-bold text-blue-900 mb-1">
                  {formatarMoeda(resultado.valorTempo)}
                </p>
                <p className="text-xs text-blue-700">
                  Valor do seu tempo
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                  Custos por atendimento
                </h3>
                <p className="text-4xl font-bold text-amber-900 mb-1">
                  {formatarMoeda(resultado.custoTotalAtendimento)}
                </p>
                <p className="text-xs text-amber-700">
                  Materiais + fixos
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-purple-800 mb-2 uppercase tracking-wide">
                  Lucro por atendimento
                </h3>
                <p className="text-4xl font-bold text-purple-900 mb-1">
                  {formatarMoeda(resultado.lucroAtendimento)}
                </p>
                <p className="text-xs text-purple-700">
                  Depois de pagar tudo
                </p>
              </div>
            </div>

            {/* Campo para estimar lucro mensal */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                  Simule seu lucro mensal
                </h3>
              </div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantos atendimentos por mês você pretende fazer?
              </label>
              <input
                type="number"
                min="0"
                value={servicoData.atendimentosSimulacao || ""}
                onChange={(e) =>
                  setServicoData({
                    ...servicoData,
                    atendimentosSimulacao: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:outline-none transition-colors"
                placeholder="Ex: 10"
              />
              {resultado.lucroSimulacao !== null && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-700 mb-1">Seu lucro mensal seria:</p>
                  <p className="text-3xl font-bold text-indigo-900">
                    {formatarMoeda(resultado.lucroSimulacao)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                💡 <strong>Entenda os números:</strong> Com esse preço, você cobre custos, 
                paga taxas e recebe aproximadamente {formatarMoeda(servicoData.valorHoraDesejado)} por hora. 
                Ajuste o valor da sua hora se quiser aumentar ou diminuir o preço final.
              </p>
            </div>

            <button
              onClick={() => {
                setCurrentStep(1);
                setServicoData({
                  horasPorAtendimento: 0,
                  valorHoraDesejado: 0,
                  custoDiretoAtendimento: 0,
                  custosFixos: [],
                  horasMes: 0,
                  taxaSobrePrecoPercent: 0,
                  atendimentosPorMes: 0,
                  atendimentosSimulacao: 0,
                });
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              Fazer novo cálculo
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão voltar */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#7A9CC6] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
        </div>

        {/* Card principal */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10">
          {/* Título e descrição */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#7A9CC6] mb-3">
              Calculadora de preço RendEx
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Calcule um preço justo para seus produtos ou serviços, levando em conta custos, tempo e taxas. Responda etapa por etapa.
            </p>
          </div>

          {/* Seletor de tipo (Produto/Serviço) - sempre visível */}
          <div className="flex gap-3 mb-8 flex-col sm:flex-row sticky top-4 z-10 bg-white/95 backdrop-blur-sm p-4 -mx-4 md:-mx-6 rounded-2xl shadow-sm">
            <button
              onClick={() => handleTypeChange("produto")}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 ${
                type === "produto"
                  ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Package className="w-6 h-6" />
              Produto / Infoproduto
            </button>
            <button
              onClick={() => handleTypeChange("servico")}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 ${
                type === "servico"
                  ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Briefcase className="w-6 h-6" />
              Serviço
            </button>
          </div>

          {/* Indicador de progresso visual */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Passo {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-bold text-[#7A9CC6]">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {/* Stepper visual com círculos */}
            <div className="hidden md:flex justify-between mt-6 px-2">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    step.number === currentStep
                      ? "opacity-100 scale-110"
                      : step.number < currentStep
                      ? "opacity-70"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                      step.number === currentStep
                        ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white shadow-lg ring-4 ring-[#7A9CC6]/20"
                        : step.number < currentStep
                        ? "bg-[#7A9CC6] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className={`text-xs text-center max-w-[90px] font-medium ${
                    step.number === currentStep ? "text-[#7A9CC6]" : "text-gray-600"
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conteúdo do passo atual */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 md:p-8 min-h-[450px] shadow-inner">
            {type === "produto" ? renderProdutoStep() : renderServicoStep()}
          </div>

          {/* Botões de navegação - grandes e com boa área de toque */}
          <div className="flex gap-4 mt-8 flex-col sm:flex-row">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex-1 flex items-center justify-center gap-2 py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                currentStep === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md active:scale-95"
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
              Voltar
            </button>

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-5 px-6 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] text-white hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300"
            >
              {currentStep < totalSteps ? "Próximo" : "Ver resultado"}
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Informação adicional */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>
            💡 Preencha todos os campos com atenção para um cálculo preciso
          </p>
        </div>
      </div>
    </div>
  );
}
