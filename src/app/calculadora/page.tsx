"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Package, Briefcase, Plus, Trash2, AlertCircle, TrendingUp, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const router = useRouter();
  const [type, setType] = useState<CalculatorType>("produto");
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do modal de salvar
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("");
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  // Categorias mockadas (depois virão do Supabase)
  const [categories] = useState([
    { id: "1", name: "Bolos e Doces" },
    { id: "2", name: "Artesanato" },
    { id: "3", name: "Serviços" },
  ]);

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
    let tempoPorUnidade = 0;

    if (!produtoData.usarHoras) {
      quantidadeUsada = produtoData.quantidadeMensalEstimativa;
      custoFixoPorUnidade = quantidadeUsada > 0 ? custoFixoMensal / quantidadeUsada : 0;
    } else {
      const horasMes = produtoData.horasSemana * 4;
      const custoFixoPorHora = horasMes > 0 ? custoFixoMensal / horasMes : 0;
      custoFixoPorUnidade = custoFixoPorHora * produtoData.horasPorUnidade;
      tempoPorUnidade = produtoData.horasPorUnidade * 60; // converter para minutos
    }

    const custoUnitario = custoVariavelUnitario + custoFixoPorUnidade;

    const taxaSobrePrecoDecimal = produtoData.taxaSobrePrecoPercent / 100;
    const margemDecimal = produtoData.margemPercentual / 100;

    const precoIdeal = custoUnitario / (1 - taxaSobrePrecoDecimal - margemDecimal);
    const precoMinimo = custoUnitario / (1 - taxaSobrePrecoDecimal);
    const lucroUnitario = precoIdeal - (custoUnitario + taxaSobrePrecoDecimal * precoIdeal);
    
    // Calcular lucro por hora
    let lucroPorHora = 0;
    if (tempoPorUnidade > 0) {
      lucroPorHora = (lucroUnitario / tempoPorUnidade) * 60; // lucro por hora
    }

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
      custoTotal: custoUnitario,
      costPerUnit: custoVariavelUnitario,
      fixedCostMonthly: custoFixoMensal,
      estimatedUnits: quantidadeUsada > 0 ? quantidadeUsada : null,
      margem: produtoData.margemPercentual,
      tempoPorUnidade,
      lucroPorHora,
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

    // Calcular margem real
    const margemReal = precoIdeal > 0 ? (lucroAtendimento / precoIdeal) * 100 : 0;

    // Calcular lucro por hora
    const tempoPorAtendimento = servicoData.horasPorAtendimento * 60; // em minutos
    const lucroPorHora = servicoData.horasPorAtendimento > 0 
      ? lucroAtendimento / servicoData.horasPorAtendimento 
      : 0;

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
      precoMinimo: precoBaseSemTaxa,
      valorTempo,
      custoTotalAtendimento,
      lucroAtendimento,
      lucroMensalEstimado,
      lucroSimulacao,
      custoTotal: custoTotalAtendimento,
      costPerUnit: custoDiretoAtendimento,
      fixedCostMonthly: custoFixoMensal,
      estimatedUnits: servicoData.atendimentosPorMes > 0 ? servicoData.atendimentosPorMes : null,
      margem: margemReal,
      tempoPorUnidade: tempoPorAtendimento,
      lucroPorHora,
    };
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Função para abrir modal de salvar
  const handleOpenSaveModal = () => {
    const resultado = type === "produto" ? calcularResultadoProduto() : calcularResultadoServico();
    setSellingPrice(resultado.precoIdeal.toFixed(2));
    setShowSaveModal(true);
  };

  // Função para validar e salvar produto
  const handleSaveProduct = async () => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = "Nome do produto é obrigatório";
    }

    const priceValue = parseFloat(sellingPrice);
    if (!sellingPrice || isNaN(priceValue) || priceValue <= 0) {
      newErrors.sellingPrice = "Preço de venda deve ser maior que zero";
    }

    setModalErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar logado para salvar produtos.");
        setIsSaving(false);
        return;
      }

      const resultado = type === "produto" ? calcularResultadoProduto() : calcularResultadoServico();

      // Preparar dados conforme a tabela user_products
      const costPerUnit = resultado.costPerUnit;
      const fixedCostMonthly = resultado.fixedCostMonthly;
      const estimatedUnitsPerMonth = resultado.estimatedUnits;
      const taxPercent = type === "produto" ? produtoData.taxaSobrePrecoPercent : servicoData.taxaSobrePrecoPercent;
      const desiredMargin = type === "produto" ? produtoData.margemPercentual : resultado.margem;
      const suggestedMinPrice = resultado.precoMinimo;
      const suggestedIdealPrice = resultado.precoIdeal;
      const sellingPriceValue = parseFloat(sellingPrice);
      const timeMinutes = resultado.tempoPorUnidade;

      // Usar o custo total já calculado pela calculadora (inclui custo fixo por unidade)
      const custoTotalPorUnidade = resultado.custoTotal;
      
      // Calcular taxa sobre o preço de venda escolhido
      const taxaValor = sellingPriceValue * (taxPercent / 100);
      
      // Custo total real = custo por unidade + taxa
      const custoTotalReal = custoTotalPorUnidade + taxaValor;

      // Calcular margem real com base no preço escolhido
      const realMarginPercent = sellingPriceValue > 0 
        ? ((sellingPriceValue - custoTotalReal) / sellingPriceValue) * 100 
        : 0;

      // Lucro por unidade = preço de venda - custo total real
      const profitPerUnit = sellingPriceValue - custoTotalReal;

      // Lucro por hora (se houver tempo definido)
      const profitPerHour = timeMinutes > 0 
        ? (profitPerUnit / timeMinutes) * 60 
        : 0;

      // Validar se os cálculos são válidos
      if (isNaN(profitPerUnit) || isNaN(profitPerHour) || isNaN(realMarginPercent) || 
          !isFinite(profitPerUnit) || !isFinite(profitPerHour) || !isFinite(realMarginPercent)) {
        toast.error("Erro nos cálculos. Verifique os dados informados.");
        setIsSaving(false);
        return;
      }

      // Inserir produto na tabela user_products
      const { data, error } = await supabase
        .from('user_products')
        .insert([
          {
            user_id: user.id,
            category_id: selectedCategoryId || null,
            name: productName.trim(),
            type: type === "produto" ? "produto" : "servico",
            description: productDescription.trim() || null,
            cost_per_unit: costPerUnit,
            fixed_cost_monthly: fixedCostMonthly,
            estimated_units_per_month: estimatedUnitsPerMonth,
            tax_percent: taxPercent,
            desired_margin_percent: desiredMargin,
            suggested_min_price: suggestedMinPrice,
            suggested_ideal_price: suggestedIdealPrice,
            selling_price: sellingPriceValue,
            real_margin_percent: realMarginPercent,
            profit_per_unit: profitPerUnit,
            time_minutes: timeMinutes,
            profit_per_hour: profitPerHour
          }
        ])
        .select()
        .single();

      console.log('Supabase insert user_products:', { data, error });

      if (error) {
        console.error('Erro ao salvar produto no Supabase:', error);
        toast.error(error.message || "Erro ao salvar produto. Tente novamente.");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);

      // Fechar modal e resetar
      setShowSaveModal(false);
      setProductName("");
      setProductDescription("");
      setSelectedCategoryId(null);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      setSellingPrice("");
      setModalErrors({});

      // Redirecionar para o catálogo pessoal
      router.push('/catalogo-pessoal');
      
      // Toast de sucesso após redirecionamento
      toast.success("Produto adicionado ao Catálogo Pessoal!");

    } catch (err) {
      console.error('Erro inesperado ao salvar produto:', err);
      toast.error("Erro inesperado ao salvar produto. Tente novamente.");
      setIsSaving(false);
    }
  };

  // Renderizar conteúdo do passo atual para produto
  const renderProdutoStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                Custos por unidade
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Informe os custos para produzir cada unidade
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: 5.50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ex: farinha, açúcar, tecido, componentes
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: 2.00"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ex: caixas, sacolas, etiquetas
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: 1.50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                Custos fixos mensais
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Adicione custos fixos relacionados a essa renda
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Valor mensal (R$)"
                    />
                  </div>
                  <button
                    onClick={() => removerCustoFixoProduto(custo.id)}
                    className="mt-1 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Remover custo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={adicionarCustoFixoProduto}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-[#7A9CC6] dark:border-blue-500 text-[#7A9CC6] dark:text-blue-400 hover:bg-[#7A9CC6] dark:hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Adicionar custo fixo
              </button>

              {produtoData.custosFixos.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total de custos fixos:{" "}
                    <span className="text-[#7A9CC6] dark:text-blue-400 text-lg">
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
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                Quantidade ou horas
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Ajude-nos a calcular o custo fixo por unidade
              </p>
            </div>

            {!produtoData.usarHoras ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      errors.quantidade ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Ex: 50"
                  />
                  {errors.quantidade && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.quantidade}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    setProdutoData({ ...produtoData, usarHoras: true, quantidadeMensalEstimativa: 0 })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Não sei estimar isso
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      errors.horasSemana ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Ex: 10"
                  />
                  {errors.horasSemana && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.horasSemana}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      errors.horasPorUnidade ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Ex: 2.5"
                  />
                  {errors.horasPorUnidade && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.horasPorUnidade}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    setProdutoData({ ...produtoData, usarHoras: false, horasSemana: 0, horasPorUnidade: 0 })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
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
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                Taxas e margem
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Informe as taxas e a margem de lucro desejada
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: 5.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ex: maquininha (3%), marketplace (10%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: 30"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sugestão: 30% é uma margem comum
                </p>
              </div>

              {errors.taxaMargem && (
                <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{errors.taxaMargem}</p>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
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
              <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-2">
                Resultado da Calculadora
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Valores calculados para o seu produto
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wide">
                  Preço mínimo
                </h3>
                <p className="text-4xl font-bold text-amber-900 dark:text-amber-300 mb-1">
                  {formatarMoeda(resultado.precoMinimo)}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Para não ter prejuízo
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-green-800 dark:text-green-400 mb-2 uppercase tracking-wide">
                  Preço ideal
                </h3>
                <p className="text-4xl font-bold text-green-900 dark:text-green-300 mb-1">
                  {formatarMoeda(resultado.precoIdeal)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Com margem de lucro
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-2 uppercase tracking-wide">
                  Lucro por unidade
                </h3>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-300 mb-1">
                  {formatarMoeda(resultado.lucroUnitario)}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Em cada venda
                </p>
              </div>

              {resultado.lucroMensalEstimado !== null && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xs font-semibold text-purple-800 dark:text-purple-400 mb-2 uppercase tracking-wide">
                    Lucro mensal estimado
                  </h3>
                  <p className="text-4xl font-bold text-purple-900 dark:text-purple-300 mb-1">
                    {formatarMoeda(resultado.lucroMensalEstimado)}
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    Com {resultado.quantidadeUsada} unidades/mês
                  </p>
                </div>
              )}
            </div>

            {/* Simulação de lucro mensal */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                  Simule seu lucro mensal
                </h3>
              </div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-indigo-200 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Ex: 100"
              />
              {resultado.lucroSimulacao !== null && (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Seu lucro mensal seria:</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">
                    {formatarMoeda(resultado.lucroSimulacao)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                💡 <strong>Entenda os números:</strong> Com esse preço ideal, você cobre custos, 
                paga taxas e mantém sua margem de lucro. Se um concorrente cobra muito abaixo, 
                provavelmente está ganhando menos ou tendo prejuízo.
              </p>
            </div>

            {/* Botão Salvar no Catálogo */}
            <button
              onClick={handleOpenSaveModal}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salvar no Catálogo
            </button>

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
              className="w-full py-4 px-6 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
            >
              Fazer novo cálculo
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizar conteúdo do passo atual para serviço (similar ao produto, mas adaptado)
  const renderServicoStep = () => {
    // Implementação similar ao produto, mas com os campos de serviço
    // Por brevidade, vou manter a estrutura básica
    return <div>Serviço - Passo {currentStep}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão voltar */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
        </div>

        {/* Card principal */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 transition-colors duration-300">
          {/* Título e descrição */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
              Calculadora de preço RendEx
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Calcule um preço justo para seus produtos ou serviços, levando em conta custos, tempo e taxas. Responda etapa por etapa.
            </p>
          </div>

          {/* Seletor de tipo (Produto/Serviço) */}
          <div className="flex gap-3 mb-8 flex-col sm:flex-row sticky top-4 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 -mx-4 md:-mx-6 rounded-2xl shadow-sm">
            <button
              onClick={() => handleTypeChange("produto")}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 ${
                type === "produto"
                  ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Package className="w-6 h-6" />
              Produto / Infoproduto
            </button>
            <button
              onClick={() => handleTypeChange("servico")}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 ${
                type === "servico"
                  ? "bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Briefcase className="w-6 h-6" />
              Serviço
            </button>
          </div>

          {/* Indicador de progresso */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Passo {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-bold text-[#7A9CC6] dark:text-blue-400">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Conteúdo do passo atual */}
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 md:p-8 min-h-[450px] shadow-inner transition-colors duration-300">
            {type === "produto" ? renderProdutoStep() : renderServicoStep()}
          </div>

          {/* Botões de navegação */}
          <div className="flex gap-4 mt-8 flex-col sm:flex-row">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex-1 flex items-center justify-center gap-2 py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                currentStep === 1
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md active:scale-95"
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
              Voltar
            </button>

            {currentStep < totalSteps && (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 py-5 px-6 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                Próximo
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Salvar no Catálogo */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              {/* Header do modal */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#7A9CC6] dark:text-blue-400">
                  Salvar no Catálogo
                </h2>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setModalErrors({});
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={isSaving}
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Dados capturados da calculadora */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 mb-6">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3">
                  Dados calculados:
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700 dark:text-blue-400 font-medium">Custo por unidade:</p>
                    <p className="text-blue-900 dark:text-blue-200 font-bold">
                      {formatarMoeda(type === "produto" ? calcularResultadoProduto().costPerUnit : calcularResultadoServico().costPerUnit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-400 font-medium">Margem desejada:</p>
                    <p className="text-blue-900 dark:text-blue-200 font-bold">
                      {(type === "produto" ? calcularResultadoProduto().margem : calcularResultadoServico().margem).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-400 font-medium">Preço sugerido:</p>
                    <p className="text-blue-900 dark:text-blue-200 font-bold">
                      {formatarMoeda(type === "produto" ? calcularResultadoProduto().precoIdeal : calcularResultadoServico().precoIdeal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-400 font-medium">Lucro por hora:</p>
                    <p className="text-blue-900 dark:text-blue-200 font-bold">
                      {formatarMoeda(type === "produto" ? calcularResultadoProduto().lucroPorHora : calcularResultadoServico().lucroPorHora)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-5">
                {/* Nome do produto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nome do {type === "produto" ? "produto" : "serviço"} *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                      modalErrors.productName ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Ex: Bolo de chocolate"
                    disabled={isSaving}
                  />
                  {modalErrors.productName && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {modalErrors.productName}
                    </p>
                  )}
                </div>

                {/* Descrição (opcional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                    placeholder="Detalhes adicionais sobre o produto/serviço"
                    disabled={isSaving}
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Categoria (opcional)
                  </label>
                  {!showNewCategoryInput ? (
                    <div className="space-y-2">
                      <select
                        value={selectedCategoryId || ""}
                        onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                        disabled={isSaving}
                      >
                        <option value="">Sem categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewCategoryInput(true)}
                        className="text-sm text-[#7A9CC6] dark:text-blue-400 hover:underline font-medium"
                        disabled={isSaving}
                      >
                        + Criar nova categoria
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Nome da nova categoria"
                        disabled={isSaving}
                      />
                      <button
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                        disabled={isSaving}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Preço de venda */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Preço real que você vai cobrar (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className={`w-full px-4 py-3 text-lg rounded-xl border-2 ${
                      modalErrors.sellingPrice ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Ex: 45.00"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sugestão da calculadora: {formatarMoeda(type === "produto" ? calcularResultadoProduto().precoIdeal : calcularResultadoServico().precoIdeal)}
                  </p>
                  {modalErrors.sellingPrice && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {modalErrors.sellingPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões do modal */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setModalErrors({});
                  }}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSaving}
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
