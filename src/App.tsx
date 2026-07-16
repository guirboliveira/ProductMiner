import { useState, useEffect, useMemo, useRef } from 'react';
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
  fetchProductDetails,
  fetchProductDescription,
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
  ShieldAlert,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState({ current: 0, total: 100 });
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Advanced tracking states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [history, setHistory] = useState<SavedMine[]>([]);
  const [currentFilters, setCurrentFilters] = useState<MiningFilters | undefined>(undefined);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCodeProcessed = useRef(false);

  // Detail extraction states
  const [selectedExtractIds, setSelectedExtractIds] = useState<string[]>([]);
  const [isExtractingDetails, setIsExtractingDetails] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0 });

  // Calculate statistics
  const stats: MiningStats = useMemo(() => calculateStats(products), [products]);

  // Read search history & token from localStorage on mount and check for OAuth code callback
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ml_miner_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read from localStorage', e);
    }

    const savedToken = localStorage.getItem('ml_access_token');
    if (savedToken) {
      setCurrentFilters(prev => ({
        ...(prev || {
          query: '',
          siteId: 'MLB',
          condition: 'all',
          shipping: 'all',
          minPrice: '',
          maxPrice: '',
          limit: 100,
        }),
        accessToken: savedToken,
      }));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !authCodeProcessed.current) {
      authCodeProcessed.current = true;
      const exchangeToken = async () => {
        setIsAuthenticating(true);
        setError(null);
        const verifier = localStorage.getItem('ml_code_verifier') || '';
        try {
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirectUri: window.location.origin + '/',
              codeVerifier: verifier,
            }),
          });
          localStorage.removeItem('ml_code_verifier');
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || data.error || 'Falha ao trocar código de autorização');
          }
          if (data.access_token) {
            localStorage.setItem('ml_access_token', data.access_token);
            setCurrentFilters(prev => ({
              ...(prev || {
                query: '',
                siteId: 'MLB',
                condition: 'all',
                shipping: 'all',
                minPrice: '',
                maxPrice: '',
                limit: 100,
              }),
              accessToken: data.access_token,
            }));
            alert('Autenticado com sucesso no Mercado Livre!');
          }
        } catch (err: any) {
          console.error(err);
          setError(`Erro na autenticação: ${err.message || 'Falha na conexão com o servidor'}`);
        } finally {
          setIsAuthenticating(false);
          // Remove query params from browser URL history
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      exchangeToken();
    }
  }, []);

  // Save manually input/updated tokens from search panel into localStorage
  useEffect(() => {
    if (currentFilters?.accessToken) {
      localStorage.setItem('ml_access_token', currentFilters.accessToken);
    }
  }, [currentFilters?.accessToken]);

  const handleLogout = () => {
    localStorage.removeItem('ml_access_token');
    setCurrentFilters(prev => prev ? { ...prev, accessToken: '' } : undefined);
    alert('Desconectado com sucesso!');
  };

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
    setErrorStatus(null);
    setSelectedExtractIds([]);
    setMiningProgress({ current: 0, total: filters.limit });
    setCurrentFilters(filters);

    try {
      const results = await mineProducts(
        filters,
        (current, total) => {
          setMiningProgress({ current, total });
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
      setError(err.message || 'Erro ao se conectar com os servidores do Mercado Livre. Verifique sua conexão e tente novamente.');
      if (err.status) {
        setErrorStatus(err.status);
      } else if (err.message && err.message.includes('Status ')) {
        const match = err.message.match(/Status (\d+)/);
        if (match && match[1]) {
          setErrorStatus(parseInt(match[1], 10));
        }
      }
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

  // Toggle product selection for details extraction
  const handleToggleExtract = (id: string) => {
    if (selectedExtractIds.includes(id)) {
      setSelectedExtractIds(selectedExtractIds.filter(item => item !== id));
    } else {
      setSelectedExtractIds([...selectedExtractIds, id]);
    }
  };

  // Bulk extract details (attributes & descriptions)
  const handleExtractDetails = async (idsToExtract: string[]) => {
    if (idsToExtract.length === 0) return;
    setIsExtractingDetails(true);
    setExtractionProgress({ current: 0, total: idsToExtract.length });
    setError(null);

    const token = localStorage.getItem('ml_access_token') || undefined;

    const extractSingleItem = async (productId: string) => {
      try {
        const [extraDetails, descText] = await Promise.all([
          fetchProductDetails(productId, token),
          fetchProductDescription(productId, token),
        ]);
        return { productId, extraDetails, descText, error: null };
      } catch (err: any) {
        console.error(`Failed to extract details for product ${productId}:`, err);
        return { productId, extraDetails: null, descText: null, error: err };
      }
    };

    const updatedProductsMap = new Map<string, Partial<MLProduct>>();
    const chunkSize = 5;
    for (let i = 0; i < idsToExtract.length; i += chunkSize) {
      const chunk = idsToExtract.slice(i, i + chunkSize);
      const results = await Promise.all(chunk.map(id => extractSingleItem(id)));
      
      results.forEach(res => {
        if (!res.error && res.extraDetails) {
          updatedProductsMap.set(res.productId, {
            ...res.extraDetails,
            description: res.descText || '',
          });
        }
      });
      setExtractionProgress(prev => ({
        ...prev,
        current: Math.min(prev.current + chunk.length, prev.total)
      }));
    }

    setProducts(prevProducts =>
      prevProducts.map(p => {
        const enrichment = updatedProductsMap.get(p.id);
        if (enrichment) {
          return {
            ...p,
            ...enrichment,
          };
        }
        return p;
      })
    );

    setIsExtractingDetails(false);
    setSelectedExtractIds([]);
    alert(`Enriquecimento concluído! Detalhes e especificações técnicas de ${updatedProductsMap.size} anúncio(s) foram extraídos e mesclados.`);
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
            {currentFilters?.accessToken ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado via API
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-150 px-2.5 py-1.5 rounded-xl font-semibold transition cursor-pointer"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                API Desconectada
              </span>
            )}
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <span className="text-xs font-extrabold text-slate-600">ML</span>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isAuthenticating && (
          <motion.div
            key="auth-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-600 text-white font-sans text-xs font-semibold px-4 py-2.5 flex items-center justify-center gap-2 shadow-inner border-b border-blue-700/20"
          >
            <Compass className="h-4 w-4 text-white animate-spin" />
            <span>
              <strong>Autenticando:</strong> Trocando código de autorização com a API do Mercado Livre...
            </span>
          </motion.div>
        )}
        {isExtractingDetails && (
          <motion.div
            key="extract-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-600 text-white font-sans text-xs font-semibold px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-3 shadow-inner border-b border-emerald-700/20"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-white animate-spin" />
              <span>
                <strong>Extração em lote ativa:</strong> Minerando descrição e especificações técnicas... ({extractionProgress.current} de {extractionProgress.total})
              </span>
            </div>
            <div className="w-48 bg-emerald-800 rounded-full h-2.5 overflow-hidden border border-emerald-500/20">
              <div
                className="bg-white h-full transition-all duration-300"
                style={{ width: `${(extractionProgress.current / extractionProgress.total) * 100}%` }}
              />
            </div>
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
              className="overflow-hidden bg-white border border-rose-100 rounded-2xl shadow-md"
              id="error-notification-bar"
            >
              {errorStatus === 403 || errorStatus === 401 || error.toLowerCase().includes('403') || error.toLowerCase().includes('forbidden') ? (
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-rose-100">
                  {/* Left Column: Icon & Title */}
                  <div className="p-6 md:w-80 bg-rose-50/50 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Operação Bloqueada</h4>
                        <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded uppercase tracking-wider mt-1">
                          Erro {errorStatus || '403 Forbidden'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">
                      Sua requisição foi rejeitada pelos sistemas de segurança/WAF do Mercado Livre. O servidor atual de nuvem (datacenter) está bloqueado para prevenir raspagem automatizada.
                    </p>
                  </div>

                  {/* Right Column: Step-by-Step Instructions */}
                  <div className="p-6 flex-1 bg-white space-y-4">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Como realizar o desbloqueio?
                    </h5>
                    <div className="space-y-4">
                      {/* Step 1: Run Locally */}
                      <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          1
                        </div>
                        <div className="space-y-0.5">
                          <h6 className="text-xs font-bold text-slate-850">Executar o Projeto Localmente</h6>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Rode a aplicação no seu computador pessoal (via terminal local). As conexões de redes domésticas (IP residencial) não são identificadas como robôs e funcionam livremente.
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Use Access Token */}
                      <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          2
                        </div>
                        <div className="space-y-0.5">
                          <h6 className="text-xs font-bold text-slate-850">Autenticar via Mercado Livre Developers (OAuth)</h6>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Use um <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-750 font-semibold font-mono">access_token</code> oficial. Clique no botão <strong>Filtros</strong> acima para colar seu token ou autenticar sua conta. Chamadas assinadas possuem maior prioridade e menos bloqueios.
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Proxy */}
                      <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          3
                        </div>
                        <div className="space-y-0.5">
                          <h6 className="text-xs font-bold text-slate-850">Configurar um Proxy Residencial</h6>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Adicione um serviço de proxy rotativo residencial no código do servidor backend (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-750 font-semibold font-mono">server.ts</code>) para mascarar os acessos de datacenters.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-bold text-rose-800">Problema ao minerar anúncios</h4>
                    <p className="text-xs text-rose-600 font-medium">{error}</p>
                    {errorStatus && (
                      <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                        Código do erro: {errorStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                selectedExtractIds={selectedExtractIds}
                onToggleExtract={handleToggleExtract}
                onToggleAllExtract={setSelectedExtractIds}
                onExtractDetails={handleExtractDetails}
                isExtractingDetails={isExtractingDetails}
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
                  accessToken: currentFilters?.accessToken,
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
