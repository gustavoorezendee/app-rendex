"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  Lightbulb,
  Award,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  type: "produto" | "servico";
  selling_price: number;
  profit_per_unit: number;
  total_units_sold: number;
  total_revenue: number;
  total_profit: number;
  rsv_score: number;
  trend_status: "subindo" | "estavel" | "caindo";
};

type Sale = {
  id: string;
  product_id: string;
  sold_at: string;
  units_sold: number;
  total_revenue: number;
  profit_total: number;
};

type WeekStats = {
  lucroTotal: number;
  vendasTotal: number;
  receitaTotal: number;
};

export default function MeuNegocioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Stats da semana atual e anterior
  const [currentWeekStats, setCurrentWeekStats] = useState<WeekStats>({ lucroTotal: 0, vendasTotal: 0, receitaTotal: 0 });
  const [previousWeekStats, setPreviousWeekStats] = useState<WeekStats>({ lucroTotal: 0, vendasTotal: 0, receitaTotal: 0 });
  
  // Melhor e pior produto
  const [bestProduct, setBestProduct] = useState<Product | null>(null);
  const [worstProduct, setWorstProduct] = useState<Product | null>(null);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/meu-negocio");
    }
  }, [user, loading, router]);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Carregar produtos
        const { data: productsData, error: productsError } = await supabase
          .from("user_products")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (productsError) {
          console.error("Erro ao carregar produtos:", productsError);
        } else {
          setProducts(productsData || []);
          
          // Determinar melhor e pior produto
          if (productsData && productsData.length > 0) {
            const sorted = [...productsData].sort((a, b) => b.total_profit - a.total_profit);
            setBestProduct(sorted[0]);
            setWorstProduct(sorted[sorted.length - 1]);
          }
        }

        // Carregar vendas dos últimos 14 dias
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data: salesData, error: salesError } = await supabase
          .from("user_product_sales")
          .select("*")
          .eq("user_id", user.id)
          .gte("sold_at", fourteenDaysAgo.toISOString())
          .order("sold_at", { ascending: false });

        if (salesError) {
          console.error("Erro ao carregar vendas:", salesError);
        } else {
          setSales(salesData || []);
          
          // Calcular stats da semana atual e anterior
          const now = new Date();
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const currentWeekSales = (salesData || []).filter((sale) => {
            const saleDate = new Date(sale.sold_at);
            return saleDate >= sevenDaysAgo && saleDate <= now;
          });

          const previousWeekSales = (salesData || []).filter((sale) => {
            const saleDate = new Date(sale.sold_at);
            const fourteenDaysAgoDate = new Date();
            fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
            return saleDate >= fourteenDaysAgoDate && saleDate < sevenDaysAgo;
          });

          setCurrentWeekStats({
            lucroTotal: currentWeekSales.reduce((acc, sale) => acc + sale.profit_total, 0),
            vendasTotal: currentWeekSales.reduce((acc, sale) => acc + sale.units_sold, 0),
            receitaTotal: currentWeekSales.reduce((acc, sale) => acc + sale.total_revenue, 0),
          });

          setPreviousWeekStats({
            lucroTotal: previousWeekSales.reduce((acc, sale) => acc + sale.profit_total, 0),
            vendasTotal: previousWeekSales.reduce((acc, sale) => acc + sale.units_sold, 0),
            receitaTotal: previousWeekSales.reduce((acc, sale) => acc + sale.total_revenue, 0),
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Calcular variação percentual
  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  // Determinar status de comparação
  const getComparisonStatus = (atual: number, anterior: number) => {
    const variacao = calcularVariacao(atual, anterior);
    if (variacao > 5) return { icon: TrendingUp, text: "crescendo", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" };
    if (variacao < -5) return { icon: TrendingDown, text: "caindo", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-900/20" };
    return { icon: Minus, text: "igual", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-900/20" };
  };

  // Gerar insights humanizados
  const generateInsights = () => {
    const insights: { type: 'success' | 'warning' | 'info'; text: string }[] = [];

    // Insight 1: Comparação com semana anterior
    const lucroStatus = getComparisonStatus(currentWeekStats.lucroTotal, previousWeekStats.lucroTotal);
    if (lucroStatus.text === "crescendo") {
      insights.push({ 
        type: 'success',
        text: `Continue assim! Seu lucro está crescendo.`
      });
    } else if (lucroStatus.text === "caindo") {
      insights.push({ 
        type: 'warning',
        text: `Seu lucro caiu esta semana. Talvez seja hora de revisar preços ou divulgar mais.`
      });
    } else {
      insights.push({ 
        type: 'info',
        text: `Seu lucro está estável. Que tal testar algo novo para crescer?`
      });
    }

    // Insight 2: Melhor produto
    if (bestProduct && bestProduct.total_profit > 0) {
      insights.push({ 
        type: 'success',
        text: `"${bestProduct.name}" é seu campeão de vendas. Foque nele!`
      });
    }

    // Insight 3: Produto com baixo desempenho
    if (worstProduct && worstProduct.total_profit < 100 && worstProduct.total_units_sold > 0) {
      insights.push({ 
        type: 'warning',
        text: `"${worstProduct.name}" está vendendo pouco. Vale revisar o preço ou a divulgação.`
      });
    }

    // Insight 4: Produtos sem vendas
    const produtosSemVendas = products.filter((p) => p.total_units_sold === 0);
    if (produtosSemVendas.length > 0) {
      insights.push({ 
        type: 'info',
        text: `Você tem ${produtosSemVendas.length} produto${produtosSemVendas.length > 1 ? 's' : ''} sem vendas ainda. Mostre ${produtosSemVendas.length > 1 ? 'eles' : 'ele'} para mais pessoas!`
      });
    }

    // Insight 5: Sem vendas na semana
    if (currentWeekStats.vendasTotal === 0) {
      insights.push({ 
        type: 'warning',
        text: `Nenhuma venda esta semana. Que tal fazer uma promoção ou divulgar nas redes sociais?`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Mostrar loading
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Não renderizar se não estiver autenticado
  if (!user) {
    return null;
  }

  const lucroStatus = getComparisonStatus(currentWeekStats.lucroTotal, previousWeekStats.lucroTotal);
  const LucroIcon = lucroStatus.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <ThemeToggle />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          {/* Título humanizado */}
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Como está seu negócio
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
              Aqui está o resumo do desempenho do seu negócio.
            </p>
          </div>
        </div>

        {/* Visão rápida - Card principal de destaque */}
        <div className="mb-10">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Você ganhou esta semana
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Últimos 7 dias
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {formatarMoeda(currentWeekStats.lucroTotal)}
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${lucroStatus.bgColor}`}>
                <LucroIcon className={`w-5 h-5 ${lucroStatus.color}`} />
                <span className={`text-sm font-medium ${lucroStatus.color}`}>
                  {lucroStatus.text === "crescendo" && "Está crescendo em relação à semana passada"}
                  {lucroStatus.text === "caindo" && "Está menor que a semana passada"}
                  {lucroStatus.text === "igual" && "Está igual à semana passada"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores da semana */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
            Números da semana
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Receita */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Você faturou
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {formatarMoeda(currentWeekStats.receitaTotal)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentWeekStats.vendasTotal} {currentWeekStats.vendasTotal === 1 ? 'venda feita' : 'vendas feitas'}
              </p>
            </div>

            {/* Produtos */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Produtos no catálogo
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {products.length}
              </div>
              <Link
                href="/catalogo-pessoal"
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Ver todos os produtos →
              </Link>
            </div>
          </div>
        </div>

        {/* Destaques de produtos */}
        {(bestProduct || worstProduct) && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
              Destaques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Melhor produto */}
              {bestProduct && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Seu produto que mais trouxe dinheiro
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-5">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      {bestProduct.name}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Lucro total até agora
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {formatarMoeda(bestProduct.total_profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Quantidade vendida
                        </p>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {bestProduct.total_units_sold} {bestProduct.total_units_sold === 1 ? 'unidade' : 'unidades'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Produto que precisa atenção */}
              {worstProduct && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Este produto está parado
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-5">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      {worstProduct.name}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Lucro total até agora
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {formatarMoeda(worstProduct.total_profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Quantidade vendida
                        </p>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {worstProduct.total_units_sold} {worstProduct.total_units_sold === 1 ? 'unidade' : 'unidades'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                      Vale revisá-lo para melhorar as vendas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights e Recomendações */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  O que você pode fazer
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Dicas baseadas nos seus dados
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const Icon = insight.type === 'success' ? CheckCircle2 : insight.type === 'warning' ? AlertTriangle : Info;
                const colorClass = insight.type === 'success' 
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'
                  : insight.type === 'warning'
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30';
                
                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border ${colorClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
