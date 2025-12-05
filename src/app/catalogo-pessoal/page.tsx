"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Briefcase,
  Edit,
  Copy,
  TrendingUp,
  DollarSign,
  Tag,
  Search,
  X,
  ShoppingCart,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  type: "produto" | "servico";
  description: string | null;
  selling_price: number;
  real_margin_percent: number;
  profit_per_unit: number;
  profit_per_hour: number | null;
  rsv_score: number;
  trend_status: "subindo" | "estavel" | "caindo";
  total_units_sold: number;
  total_revenue: number;
  total_profit: number;
  is_active: boolean;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  desired_margin_percent: number;
  cost_per_unit: number;
  fixed_cost_monthly: number;
  tax_percent: number;
  time_minutes: number;
  estimated_units_per_month: number | null;
  suggested_min_price: number;
  suggested_ideal_price: number;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
};

export default function CatalogoPessoalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Estados do modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category_id: "",
    type: "produto" as "produto" | "servico",
    selling_price: 0,
    desired_margin_percent: 0,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Estados do modal de registro de venda
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [saleMode, setSaleMode] = useState<"quantity" | "revenue">("quantity");
  const [saleForm, setSaleForm] = useState({
    units_sold: 0,
    revenue: 0,
    sale_date: new Date().toISOString().split('T')[0]
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados do modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/catalogo-pessoal");
    }
  }, [user, loading, router]);

  // Carregar produtos e categorias
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Carregar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("user_product_categories")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (categoriesError) {
          console.error("Erro ao carregar categorias:", categoriesError);
        } else {
          setCategories(categoriesData || []);
        }

        // Carregar produtos ativos ordenados por created_at desc
        const { data: productsData, error: productsError } = await supabase
          .from("user_products")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Erro ao carregar produtos:", productsError);
        } else {
          // Enriquecer produtos com nome da categoria
          const enrichedProducts = (productsData || []).map((product) => {
            const category = categoriesData?.find((c) => c.id === product.category_id);
            return {
              ...product,
              category_name: category?.name,
              category_color: category?.color,
            };
          });
          setProducts(enrichedProducts);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Filtrar produtos em memória (busca + categoria + tipo)
  const filteredProducts = products.filter((product) => {
    // Filtro de busca por nome (case insensitive)
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de categoria
    const matchesCategory = filterCategory === "all" || 
      product.category_id === filterCategory;
    
    // Filtro de tipo
    const matchesType = filterType === "all" || 
      product.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Abrir modal de edição
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category_id: product.category_id || "",
      type: product.type,
      selling_price: product.selling_price,
      desired_margin_percent: product.desired_margin_percent,
      is_active: product.is_active
    });
    setIsEditModalOpen(true);
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setEditForm({
      name: "",
      category_id: "",
      type: "produto",
      selling_price: 0,
      desired_margin_percent: 0,
      is_active: true
    });
  };

  // Abrir modal de registro de venda
  const handleOpenSaleModal = (product: Product) => {
    setSaleProduct(product);
    setSaleMode("quantity");
    setSaleForm({
      units_sold: 0,
      revenue: 0,
      sale_date: new Date().toISOString().split('T')[0]
    });
    setIsSaleModalOpen(true);
  };

  // Fechar modal de registro de venda
  const handleCloseSaleModal = () => {
    setIsSaleModalOpen(false);
    setSaleProduct(null);
    setSaleMode("quantity");
    setSaleForm({
      units_sold: 0,
      revenue: 0,
      sale_date: new Date().toISOString().split('T')[0]
    });
  };

  // Abrir modal de exclusão
  const handleOpenDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Fechar modal de exclusão
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingProduct(null);
  };

  // Calcular métricas automaticamente
  const calculateMetrics = (
    sellingPrice: number,
    desiredMargin: number,
    product: Product
  ) => {
    // Custo total por unidade (incluindo custo fixo rateado)
    const unitsPerMonth = product.estimated_units_per_month || 1;
    const fixedCostPerUnit = product.fixed_cost_monthly / unitsPerMonth;
    const totalCostPerUnit = product.cost_per_unit + fixedCostPerUnit;

    // Aplicar taxa sobre o preço
    const taxAmount = sellingPrice * (product.tax_percent / 100);
    const totalCostWithTax = totalCostPerUnit + taxAmount;

    // Calcular margem real
    const realMarginPercent = ((sellingPrice - totalCostWithTax) / sellingPrice) * 100;

    // Calcular lucro por unidade
    const profitPerUnit = sellingPrice - totalCostWithTax;

    // Calcular lucro por hora
    const timeInHours = product.time_minutes / 60;
    const profitPerHour = timeInHours > 0 ? profitPerUnit / timeInHours : 0;

    return {
      real_margin_percent: realMarginPercent,
      profit_per_unit: profitPerUnit,
      profit_per_hour: profitPerHour
    };
  };

  // Calcular RSV Score
  const calculateRSVScore = (product: Product) => {
    let score = 0;

    // 1. Margem de lucro (0-40 pontos)
    const marginScore = Math.min(40, (product.real_margin_percent / 100) * 40);
    score += marginScore;

    // 2. Lucro por hora (0-30 pontos)
    const profitPerHour = product.profit_per_hour || 0;
    const profitPerHourScore = Math.min(30, (profitPerHour / 100) * 30);
    score += profitPerHourScore;

    // 3. Consistência de vendas (0-20 pontos)
    const totalSales = product.total_units_sold || 0;
    const consistencyScore = Math.min(20, (totalSales / 50) * 20);
    score += consistencyScore;

    // 4. Tendência (0-10 pontos)
    const trendScore = product.trend_status === "subindo" ? 10 : product.trend_status === "estavel" ? 5 : 0;
    score += trendScore;

    return Math.round(score);
  };

  // Calcular tendência
  const calculateTrendStatus = async (productId: string): Promise<"subindo" | "estavel" | "caindo"> => {
    if (!user) return "estavel";

    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);

      // Vendas dos últimos 7 dias
      const { data: recentSales } = await supabase
        .from("user_product_sales")
        .select("units_sold")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .gte("sold_at", sevenDaysAgo.toISOString().split('T')[0]);

      // Vendas dos 7 dias anteriores
      const { data: previousSales } = await supabase
        .from("user_product_sales")
        .select("units_sold")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .gte("sold_at", fourteenDaysAgo.toISOString().split('T')[0])
        .lt("sold_at", sevenDaysAgo.toISOString().split('T')[0]);

      const recentTotal = recentSales?.reduce((sum, sale) => sum + sale.units_sold, 0) || 0;
      const previousTotal = previousSales?.reduce((sum, sale) => sum + sale.units_sold, 0) || 0;

      if (recentTotal > previousTotal * 1.1) return "subindo";
      if (recentTotal < previousTotal * 0.9) return "caindo";
      return "estavel";
    } catch (error) {
      console.error("Erro ao calcular tendência:", error);
      return "estavel";
    }
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!user || !editingProduct) return;

    if (!editForm.name || editForm.selling_price <= 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);

    try {
      // Calcular métricas atualizadas
      const metrics = calculateMetrics(
        editForm.selling_price,
        editForm.desired_margin_percent,
        editingProduct
      );

      // Atualizar no Supabase
      const { data, error } = await supabase
        .from("user_products")
        .update({
          name: editForm.name,
          category_id: editForm.category_id || null,
          type: editForm.type,
          selling_price: editForm.selling_price,
          desired_margin_percent: editForm.desired_margin_percent,
          real_margin_percent: metrics.real_margin_percent,
          profit_per_unit: metrics.profit_per_unit,
          profit_per_hour: metrics.profit_per_hour,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingProduct.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar produto:", error);
        toast.error("Erro ao atualizar produto. Tente novamente.");
        return;
      }

      // Atualizar lista local
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === editingProduct.id) {
            const category = categories.find((c) => c.id === editForm.category_id);
            return {
              ...p,
              ...data,
              category_name: category?.name,
              category_color: category?.color
            };
          }
          return p;
        })
      );

      toast.success("Produto atualizado com sucesso.");
      handleCloseEditModal();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      toast.error("Erro ao atualizar produto. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicar produto
  const handleDuplicateProduct = async (productId: string) => {
    if (!user || isDuplicating) return;

    setIsDuplicating(true);

    try {
      // Buscar produto original
      const { data: originalProduct, error: fetchError } = await supabase
        .from("user_products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !originalProduct) {
        console.error("Erro ao buscar produto original:", fetchError);
        toast.error("Erro ao duplicar produto. Tente novamente.");
        setIsDuplicating(false);
        return;
      }

      // Criar nome duplicado
      const duplicatedName = `${originalProduct.name} (cópia)`;

      // Inserir novo produto com campos copiados
      const { data: newProduct, error: insertError } = await supabase
        .from("user_products")
        .insert({
          user_id: originalProduct.user_id,
          category_id: originalProduct.category_id,
          name: duplicatedName,
          type: originalProduct.type,
          description: originalProduct.description,
          cost_per_unit: originalProduct.cost_per_unit,
          fixed_cost_monthly: originalProduct.fixed_cost_monthly,
          estimated_units_per_month: originalProduct.estimated_units_per_month,
          tax_percent: originalProduct.tax_percent,
          desired_margin_percent: originalProduct.desired_margin_percent,
          suggested_min_price: originalProduct.suggested_min_price,
          suggested_ideal_price: originalProduct.suggested_ideal_price,
          selling_price: originalProduct.selling_price,
          real_margin_percent: originalProduct.real_margin_percent,
          profit_per_unit: originalProduct.profit_per_unit,
          time_minutes: originalProduct.time_minutes,
          profit_per_hour: originalProduct.profit_per_hour,
          rsv_score: originalProduct.rsv_score,
          trend_status: originalProduct.trend_status,
          is_active: originalProduct.is_active,
          // Campos resetados
          total_units_sold: 0,
          total_revenue: 0,
          total_profit: 0
        })
        .select()
        .single();

      if (insertError || !newProduct) {
        console.error("Erro ao inserir produto duplicado:", insertError);
        toast.error("Erro ao duplicar produto. Tente novamente.");
        setIsDuplicating(false);
        return;
      }

      // Enriquecer produto duplicado com categoria
      const category = categories.find((c) => c.id === newProduct.category_id);
      const enrichedNewProduct = {
        ...newProduct,
        category_name: category?.name,
        category_color: category?.color
      };

      // Adicionar à lista no início
      setProducts((prev) => [enrichedNewProduct, ...prev]);

      // Rolar até o novo produto
      setTimeout(() => {
        const firstCard = document.querySelector('[data-product-id]');
        if (firstCard) {
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      toast.success("Produto duplicado com sucesso.");
    } catch (error) {
      console.error("Erro ao duplicar produto:", error);
      toast.error("Erro ao duplicar produto. Tente novamente.");
    } finally {
      setIsDuplicating(false);
    }
  };

  // Excluir produto
  const handleDeleteProduct = async () => {
    if (!user || !deletingProduct || isDeleting) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("user_products")
        .delete()
        .eq("id", deletingProduct.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto. Tente novamente.");
        setIsDeleting(false);
        return;
      }

      // Remover produto da lista local
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));

      toast.success("Produto excluído com sucesso.");
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Registrar venda
  const handleRegisterSale = async () => {
    if (!user || !saleProduct || isRegistering) return;

    // Validações
    if (saleMode === "quantity" && saleForm.units_sold <= 0) {
      toast.error("Informe a quantidade vendida.");
      return;
    }

    if (saleMode === "revenue" && saleForm.revenue <= 0) {
      toast.error("Informe o valor faturado.");
      return;
    }

    if (!saleForm.sale_date) {
      toast.error("Informe a data da venda.");
      return;
    }

    setIsRegistering(true);

    try {
      // Calcular valores baseado no modo
      let units_sold = 0;
      let total_revenue = 0;
      let profit_total = 0;

      if (saleMode === "quantity") {
        units_sold = saleForm.units_sold;
        total_revenue = units_sold * saleProduct.selling_price;
        profit_total = units_sold * saleProduct.profit_per_unit;
      } else {
        total_revenue = saleForm.revenue;
        units_sold = Math.floor(total_revenue / saleProduct.selling_price);
        profit_total = units_sold * saleProduct.profit_per_unit;
      }

      // Inserir venda na tabela user_product_sales com schema correto
      const { data: saleData, error: saleError } = await supabase
        .from("user_product_sales")
        .insert([{
          user_id: user.id,
          product_id: saleProduct.id,
          sold_at: saleForm.sale_date,
          units_sold,
          total_revenue,
          selling_price: saleProduct.selling_price,
          profit_per_unit: saleProduct.profit_per_unit,
          profit_total,
          margin_percent: saleProduct.real_margin_percent,
          rsv_score_at_sale: saleProduct.rsv_score
        }])
        .select()
        .single();

      if (saleError) {
        console.error("Erro ao registrar venda:", saleError);
        toast.error(`Erro ao registrar venda: ${saleError.message || 'Tente novamente.'}`);
        setIsRegistering(false);
        return;
      }

      // Buscar todas as vendas do produto para recalcular agregados
      const { data: allSales, error: salesError } = await supabase
        .from("user_product_sales")
        .select("units_sold, total_revenue, profit_total")
        .eq("product_id", saleProduct.id)
        .eq("user_id", user.id);

      if (salesError) {
        console.error("Erro ao buscar vendas:", salesError);
        toast.error("Erro ao atualizar totais. Tente novamente.");
        setIsRegistering(false);
        return;
      }

      // Calcular totais
      const total_units_sold = allSales?.reduce((sum, sale) => sum + sale.units_sold, 0) || 0;
      const total_revenue_sum = allSales?.reduce((sum, sale) => sum + sale.total_revenue, 0) || 0;
      const total_profit_sum = allSales?.reduce((sum, sale) => sum + sale.profit_total, 0) || 0;

      // Calcular RSV e tendência
      const trend_status = await calculateTrendStatus(saleProduct.id);
      const updatedProduct = {
        ...saleProduct,
        total_units_sold,
        total_revenue: total_revenue_sum,
        total_profit: total_profit_sum,
        trend_status
      };
      const rsv_score = calculateRSVScore(updatedProduct);

      // Atualizar produto com agregados, RSV e tendência
      const { error: updateError } = await supabase
        .from("user_products")
        .update({
          total_units_sold,
          total_revenue: total_revenue_sum,
          total_profit: total_profit_sum,
          rsv_score,
          trend_status,
          updated_at: new Date().toISOString()
        })
        .eq("id", saleProduct.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar produto:", updateError);
        toast.error("Erro ao atualizar produto. Tente novamente.");
        setIsRegistering(false);
        return;
      }

      // Atualizar lista local
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === saleProduct.id) {
            return {
              ...p,
              total_units_sold,
              total_revenue: total_revenue_sum,
              total_profit: total_profit_sum,
              rsv_score,
              trend_status
            };
          }
          return p;
        })
      );

      toast.success("Venda registrada com sucesso.");
      handleCloseSaleModal();
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda. Tente novamente.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Cor do RSV Score
  const getRSVColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  // Ícone e cor de tendência
  const getTrendDisplay = (trend: string) => {
    if (trend === "subindo") {
      return { icon: "📈", text: "Subindo", color: "text-green-600 dark:text-green-400" };
    }
    if (trend === "caindo") {
      return { icon: "📉", text: "Caindo", color: "text-red-600 dark:text-red-400" };
    }
    return { icon: "➡️", text: "Estável", color: "text-gray-600 dark:text-gray-400" };
  };

  // Mostrar loading
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9CC6] dark:border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não renderizar se não estiver autenticado
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-[#F0F8FF] to-[#FFE8E8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#7A9CC6] dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
        </div>

        {/* Título e descrição */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#7A9CC6] dark:text-blue-400 mb-3">
            📦 Catálogo Pessoal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
            Gerencie seus produtos e serviços
          </p>
        </div>

        {/* Barra de ações */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Filtro por categoria */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Filtro por tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Todos os tipos</option>
              <option value="produto">Produtos</option>
              <option value="servico">Serviços</option>
            </select>

            {/* Botão adicionar */}
            <Link
              href="/calculadora"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Adicionar
            </Link>
          </div>
        </div>

        {/* Lista de produtos */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {products.length === 0
                ? "Comece adicionando seu primeiro produto ou serviço usando a Calculadora de Preço"
                : "Tente ajustar os filtros de busca"}
            </p>
            {products.length === 0 && (
              <Link
                href="/calculadora"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Adicionar primeiro produto
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const trendDisplay = getTrendDisplay(product.trend_status);
              
              return (
                <div
                  key={product.id}
                  data-product-id={product.id}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        product.type === "produto"
                          ? "from-blue-500 to-indigo-600"
                          : "from-purple-500 to-pink-600"
                      } flex items-center justify-center`}>
                        {product.type === "produto" ? (
                          <Package className="w-6 h-6 text-white" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {product.name}
                        </h3>
                        {product.category_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {product.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* RSV Score */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getRSVColor(product.rsv_score)}`}>
                        {product.rsv_score}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">RSV</div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {product.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Métricas principais */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-green-800 dark:text-green-400 font-semibold">Preço</span>
                      </div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-300">
                        {formatarMoeda(product.selling_price)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-800 dark:text-blue-400 font-semibold">Margem</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {product.real_margin_percent.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs text-purple-800 dark:text-purple-400 font-semibold">Lucro/un</span>
                      </div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {formatarMoeda(product.profit_per_unit)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs text-amber-800 dark:text-amber-400 font-semibold">Vendas</span>
                      </div>
                      <div className="text-lg font-bold text-amber-900 dark:text-amber-300">
                        {product.total_units_sold}
                      </div>
                    </div>
                  </div>

                  {/* Tendência */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tendência:</span>
                    <span className={`text-sm font-semibold ${trendDisplay.color}`}>
                      {trendDisplay.icon} {trendDisplay.text}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenSaleModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-md transition-all duration-300"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Registrar venda
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#7A9CC6] dark:bg-blue-600 text-white font-semibold hover:shadow-md transition-all duration-300"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDuplicateProduct(product.id)}
                      disabled={isDuplicating}
                      className="py-2 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Duplicar produto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(product)}
                      className="py-2 px-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do modal */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Editar Produto
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do produto ou serviço *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Ex: Bolo de chocolate"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "produto" | "servico" })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>

              {/* Preço de venda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Preço de venda atual *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.selling_price}
                  onChange={(e) => setEditForm({ ...editForm, selling_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>

              {/* Margem desejada */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Margem de lucro desejada (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={editForm.desired_margin_percent}
                  onChange={(e) => setEditForm({ ...editForm, desired_margin_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.0"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editForm.is_active ? "ativo" : "inativo"}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "ativo" })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#7A9CC6] dark:focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Preview dos cálculos */}
              {editForm.selling_price > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📊 Cálculos Atualizados
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Margem Real</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {calculateMetrics(editForm.selling_price, editForm.desired_margin_percent, editingProduct).real_margin_percent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lucro/Unidade</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatarMoeda(calculateMetrics(editForm.selling_price, editForm.desired_margin_percent, editingProduct).profit_per_unit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lucro/Hora</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {formatarMoeda(calculateMetrics(editForm.selling_price, editForm.desired_margin_percent, editingProduct).profit_per_hour)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
              <button
                onClick={handleCloseEditModal}
                disabled={isSaving}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A9CC6] to-[#8A7CA8] dark:from-blue-600 dark:to-purple-600 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Venda */}
      {isSaleModalOpen && saleProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Header do modal */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Registrar Venda
                  </h2>
                  <p className="text-green-100 text-sm">
                    {saleProduct.name}
                  </p>
                </div>
                <button
                  onClick={handleCloseSaleModal}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6 space-y-6">
              {/* Escolha do modo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Como deseja registrar a venda?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSaleMode("quantity")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      saleMode === "quantity"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-green-300"
                    }`}
                  >
                    <Package className={`w-6 h-6 mx-auto mb-2 ${
                      saleMode === "quantity" ? "text-green-600" : "text-gray-400"
                    }`} />
                    <p className={`text-sm font-semibold ${
                      saleMode === "quantity" ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      Quantidade vendida
                    </p>
                  </button>
                  <button
                    onClick={() => setSaleMode("revenue")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      saleMode === "revenue"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-green-300"
                    }`}
                  >
                    <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                      saleMode === "revenue" ? "text-green-600" : "text-gray-400"
                    }`} />
                    <p className={`text-sm font-semibold ${
                      saleMode === "revenue" ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      Valor faturado
                    </p>
                  </button>
                </div>
              </div>

              {/* Campo baseado no modo */}
              {saleMode === "quantity" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade vendida *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={saleForm.units_sold || ""}
                    onChange={(e) => setSaleForm({ ...saleForm, units_sold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="Ex: 5"
                  />
                  {saleForm.units_sold > 0 && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Receita: <span className="font-bold text-green-600 dark:text-green-400">
                        {formatarMoeda(saleForm.units_sold * saleProduct.selling_price)}
                      </span>
                      {" | "}
                      Lucro: <span className="font-bold text-green-600 dark:text-green-400">
                        {formatarMoeda(saleForm.units_sold * saleProduct.profit_per_unit)}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Valor faturado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleForm.revenue || ""}
                    onChange={(e) => setSaleForm({ ...saleForm, revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="Ex: 150.00"
                  />
                  {saleForm.revenue > 0 && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Quantidade: <span className="font-bold text-green-600 dark:text-green-400">
                        {Math.floor(saleForm.revenue / saleProduct.selling_price)} unidades
                      </span>
                      {" | "}
                      Lucro: <span className="font-bold text-green-600 dark:text-green-400">
                        {formatarMoeda(Math.floor(saleForm.revenue / saleProduct.selling_price) * saleProduct.profit_per_unit)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Data da venda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data da venda *
                </label>
                <input
                  type="date"
                  value={saleForm.sale_date}
                  onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer do modal */}
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-b-2xl flex gap-3">
              <button
                onClick={handleCloseSaleModal}
                disabled={isRegistering}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterSale}
                disabled={isRegistering}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isRegistering ? "Registrando..." : "Registrar Venda"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && deletingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header do modal */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Excluir Produto
                  </h2>
                </div>
                <button
                  onClick={handleCloseDeleteModal}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Deseja realmente excluir este produto?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <strong className="text-gray-900 dark:text-gray-100">{deletingProduct.name}</strong>
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
                    ⚠️ Atenção: Esta ação não pode ser desfeita!
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Ao excluir este produto, todo o histórico de vendas ligado a ele também será apagado permanentemente.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer do modal */}
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-b-2xl flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
