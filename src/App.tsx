import { useState, useEffect, useMemo } from 'react';
import {
  MLProduct,
  MiningFilters,
  MiningStats,
  SavedMine,
} from './types';
import {
  mineProducts,
  calculateStats,
  ML_SITES,
} from './utils/mercadoLibre';
import SearchPanel from './components/SearchPanel';
import DashboardStats from './components/DashboardStats';
import ChartsPanel from './components/ChartsPanel';
import InsightsPanel from './components/InsightsPanel';
import ProductTable from './components/ProductTable';
import ProductDetailModal from './components/ProductDetailModal';
import ComparePanel from './components/ComparePanel';
import SavedSearches from './components/SavedSearches';
import {
  Sparkles,
  ShieldAlert,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState({ current: 0, total: 100 });
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Advanced tracking states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [history, setHistory] = useState<SavedMine[]>([]);
  const [currentFilters, setCurrentFilters] = useState<MiningFilters | undefined>(undefined);

  // Calculate statistics
  const stats: MiningStats = useMemo(() => calculateStats(products), [products]);

  // Read search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ml_miner_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read from localStorage', e);
    }
  }, []);

  // Sync search history with localStorage
  const saveHistoryToStorage = (updated: SavedMine[]) => {
    try {
      localStorage.setItem('ml_miner_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  };

  // Perform mining action
  const handleMine = async (filters: MiningFilters) => {
    setIsMining(true);
    setProducts([]);
    setError(null);
    setMiningProgress({ current: 0, total: filters.limit });
    setCurrentFilters(filters);

    try {
      const results = await mineProducts(
        filters,
        (current, total) => {
          setMiningProgress({ current, total });
        },
        (demoActive) => {
          setIsDemoMode(demoActive);
        }
      );

      setProducts(results);

      if (results.length > 0) {
        // Save to History list
        const newMine: SavedMine = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          name: filters.query,
          filters,
          productCount: results.length,
        };

        // Enforce maximum history capacity of 8 searches
        const updatedHistory = [newMine, ...history.filter((h) => h.filters.query !== filters.query)].slice(0, 8);
        setHistory(updatedHistory);
        saveHistoryToStorage(updatedHistory);
      } else {
        setError('Nenhum produto foi encontrado. Tente buscar por outros termos de pesquisa.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao se conectar com os servidores do Mercado Livre. Verifique sua conexão e tente novamente.');
    } finally {
      setIsMining(false);
    }
  };

  // Re-run saved search
  const handleLoadSearch = (savedMine: SavedMine) => {
    const filtersToRun = {
      ...savedMine.filters,
      accessToken: currentFilters?.accessToken || savedMine.filters.accessToken,
    };
    handleMine(filtersToRun);
  };

  // Delete search from history
  const handleDeleteSearch = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    saveHistoryToStorage(updated);
  };

  // Compare listings
  const handleToggleCompare = (productId: string) => {
    if (compareProductIds.includes(productId)) {
      setCompareProductIds(compareProductIds.filter((id) => id !== productId));
    } else {
      if (compareProductIds.length >= 4) {
        alert('Você pode comparar no máximo 4 produtos simultaneamente.');
        return;
      }
      setCompareProductIds([...compareProductIds, productId]);
    }
  };

  const handleRemoveCompare = (id: string) => {
    setCompareProductIds(compareProductIds.filter((item) => item !== id));
  };

  const handleClearCompare = () => {
    setCompareProductIds([]);
  };

  // Find products selected for comparison
  const comparedProducts = useMemo(() => {
    return products.filter((p) => compareProductIds.includes(p.id));
  }, [products, compareProductIds]);

  const activeProductForDetails = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const activeSite = currentFilters?.siteId || 'MLB';
  const selectedSiteData = ML_SITES.find((s) => s.id === activeSite) || ML_SITES[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800" id="main-app-root">
      {/* Visual Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs" id="app-header-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold font-display text-slate-900 tracking-tight flex items-center gap-1.5">
                Minerador de Produtos ML
                <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-950 font-bold rounded-md text-[9px] uppercase tracking-wider">
                  v3.0 PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Extração e análise de mercado em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Compass className="h-3.5 w-3.5 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
              API Conectada
            </span>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <span className="text-xs font-extrabold text-slate-600">ML</span>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500 text-white font-sans text-xs font-semibold px-4 py-2.5 flex items-center justify-center gap-2 shadow-inner border-b border-amber-600/20"
          >
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span>
              <strong>Modo de Demonstração Ativo:</strong> As chamadas oficiais falharam ou não possuem um token. Exibindo dados simulados de alta fidelidade. Para usar dados em tempo real, configure seu access token no painel de filtros abaixo.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Saved Searches Grid */}
        <SavedSearches
          history={history}
          onLoadSearch={handleLoadSearch}
          onDeleteSearch={handleDeleteSearch}
        />

        {/* Mining filter config */}
        <SearchPanel
          onMine={handleMine}
          isMining={isMining}
          miningProgress={miningProgress}
          initialFilters={currentFilters}
        />

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3"
              id="error-notification-bar"
            >
              <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-800">Problema ao minerar anúncios</h4>
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Panels & Results */}
        {products.length > 0 ? (
          <div className="space-y-6" id="mined-results-container">
            {/* Key Performance Indicators */}
            <DashboardStats stats={stats} currencySymbol={selectedSiteData.currency} />

            {/* Compared Products Showcase */}
            {comparedProducts.length > 0 && (
              <ComparePanel
                products={comparedProducts}
                onRemoveCompare={handleRemoveCompare}
                onClearCompare={handleClearCompare}
                currencySymbol={selectedSiteData.currency}
              />
            )}

            {/* Price ranges and Logistic charts */}
            <ChartsPanel products={products} currencySymbol={selectedSiteData.currency} />

            {/* Keyword tags, bargains, competitors */}
            <InsightsPanel
              products={products}
              averagePrice={stats.averagePrice}
              currencySymbol={selectedSiteData.currency}
            />

            {/* Core listing grid & Table database */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Listagem Completa de Produtos Minerados</h3>
                  <p className="text-xs text-slate-400">Varredura profunda extraída da API pública</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {products.length} Anúncios
                </span>
              </div>

              <ProductTable
                products={products}
                onSelectProduct={setSelectedProductId}
                selectedCompareIds={compareProductIds}
                onToggleCompare={handleToggleCompare}
                currencySymbol={selectedSiteData.currency}
              />
            </div>
          </div>
        ) : (
          !isMining && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-6 flex flex-col items-center"
              id="empty-placeholder-view"
            >
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Compass className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold font-display text-slate-800">Nenhum produto minerado no momento</h2>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed font-semibold">
                  Nossa plataforma conecta diretamente com a API oficial do Mercado Livre. Defina um termo de busca e país acima para começar a minerar concorrentes, encontrar margens e extrair dados técnicos.
                </p>
              </div>

              {/* Guide bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 text-left">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="h-6 w-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center">1</div>
                  <h4 className="text-xs font-bold text-slate-700">Escolha o País</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Consulte listagens do Brasil, México, Argentina e mais.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="h-6 w-6 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center justify-center">2</div>
                  <h4 className="text-xs font-bold text-slate-700">Analise Insights</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Descubra palavras-chave mais quentes de SEO e marcas líderes.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="h-6 w-6 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center justify-center">3</div>
                  <h4 className="text-xs font-bold text-slate-700">Identifique Barganhas</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Encontre anúncios com valores inferiores à média do mercado.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleMine({
                  query: 'Filtro de Linha Clamper',
                  siteId: 'MLB',
                  condition: 'all',
                  shipping: 'all',
                  minPrice: '',
                  maxPrice: '',
                  limit: 100,
                })}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-200"
              >
                <span>Rodar Busca de Teste</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )
        )}
      </main>

      {/* Footer credits and information */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Minerador Mercado Livre © 2026</span>
          <span className="flex items-center gap-1">
            Desenvolvido de forma integrada com a API Oficial do Mercado Livre
          </span>
        </div>
      </footer>

      {/* Slide-out product details drawer */}
      <ProductDetailModal
        product={activeProductForDetails}
        onClose={() => setSelectedProductId(null)}
        currencySymbol={selectedSiteData.currency}
      />
    </div>
  );
}
