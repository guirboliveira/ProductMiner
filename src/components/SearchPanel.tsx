import React, { useState } from 'react';
import { Search, SlidersHorizontal, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { MiningFilters } from '../types';
import { ML_SITES } from '../utils/mercadoLibre';
import { motion, AnimatePresence } from 'motion/react';

interface SearchPanelProps {
  onMine: (filters: MiningFilters) => void;
  isMining: boolean;
  miningProgress: { current: number; total: number };
  initialFilters?: MiningFilters;
}

export default function SearchPanel({
  onMine,
  isMining,
  miningProgress,
  initialFilters,
}: SearchPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MiningFilters>(
    initialFilters || {
      query: '',
      siteId: 'MLB',
      condition: 'all',
      shipping: 'all',
      minPrice: '',
      maxPrice: '',
      limit: 100,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.query.trim()) return;
    onMine(filters);
  };

  const handleQuickSearch = (query: string) => {
    const updated = { ...filters, query };
    setFilters(updated);
    onMine(updated);
  };

  const selectedSite = ML_SITES.find((s) => s.id === filters.siteId) || ML_SITES[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" id="search-panel-container">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top bar: Site selector and Query input */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="md:w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 font-sans" htmlFor="site-select">
              País / Site
            </label>
            <select
              id="site-select"
              value={filters.siteId}
              disabled={isMining}
              onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
              className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium text-slate-700 transition cursor-pointer"
            >
              {ML_SITES.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 font-sans" htmlFor="query-input">
              O que deseja minerar? (Termo de busca)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                id="query-input"
                type="text"
                disabled={isMining}
                placeholder="Ex: Teclado mecânico, Smartphone, Relógio inteligente..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="w-full h-11 pl-11 pr-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium text-slate-800 transition outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-end gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 border rounded-xl flex items-center gap-2 text-sm font-medium transition cursor-pointer ${
                showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="filter-toggle-button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>

            <button
              type="submit"
              disabled={isMining || !filters.query.trim()}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 disabled:scale-100 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition cursor-pointer flex-1 md:flex-initial shadow-md shadow-blue-200/50"
              id="mine-submit-button"
            >
              {isMining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Minerando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Minerar Mercado Livre</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic loading progress bar */}
        <AnimatePresence>
          {isMining && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800">Extraindo listagens da API</h4>
                  <p className="text-xs text-blue-600">Buscando do site oficial do Mercado Livre ({selectedSite.name})</p>
                </div>
              </div>
              <div className="flex-1 max-w-xs space-y-1">
                <div className="flex justify-between text-xs font-semibold text-blue-800">
                  <span>Varrendo produtos...</span>
                  <span>
                    {miningProgress.current} / {miningProgress.total} itens
                  </span>
                </div>
                <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (miningProgress.current / miningProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {/* Condition Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="condition-select">
                    Condição do Produto
                  </label>
                  <select
                    id="condition-select"
                    value={filters.condition}
                    disabled={isMining}
                    onChange={(e) =>
                      setFilters({ ...filters, condition: e.target.value as any })
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="new">Novos apenas</option>
                    <option value="used">Usados apenas</option>
                  </select>
                </div>

                {/* Shipping Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="shipping-select">
                    Tipo de Frete
                  </label>
                  <select
                    id="shipping-select"
                    value={filters.shipping}
                    disabled={isMining}
                    onChange={(e) =>
                      setFilters({ ...filters, shipping: e.target.value as any })
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-blue-500"
                  >
                    <option value="all">Todos os fretes</option>
                    <option value="free">Apenas Frete Grátis</option>
                  </select>
                </div>

                {/* Price limits */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Faixa de Preço ({selectedSite.currency})
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Mín"
                      disabled={isMining}
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400"
                    />
                    <span className="text-slate-400 text-xs">a</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      disabled={isMining}
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Limit of products */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="limit-select">
                    Limite de Mineração
                  </label>
                  <select
                    id="limit-select"
                    value={filters.limit}
                    disabled={isMining}
                    onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-blue-500"
                  >
                    <option value="50">50 produtos (Mais Rápido)</option>
                    <option value="100">100 produtos (Recomendado)</option>
                    <option value="150">150 produtos</option>
                    <option value="200">200 produtos (Mais Profundo)</option>
                  </select>
                </div>

                {/* Access Token Field (Full Width / Col Span) */}
                <div className="sm:col-span-2 md:col-span-4 pt-3 mt-3 border-t border-slate-200/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-slate-700 font-sans" htmlFor="token-input">
                      Mercado Livre Access Token (Opcional para Modo Oficial)
                    </label>
                    <a
                      href="https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Como obter um token? ↗
                    </a>
                  </div>
                  <input
                    id="token-input"
                    type="password"
                    disabled={isMining}
                    placeholder="Cole aqui seu APP_USR access token (ex: APP_USR-83421...)"
                    value={filters.accessToken || ''}
                    onChange={(e) => setFilters({ ...filters, accessToken: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 outline-none focus:border-blue-500 placeholder:text-slate-400 font-mono tracking-wider"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Suggested trends quick tags */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium font-sans">Termos sugeridos:</span>
        {[
          'PlayStation 5',
          'Notebook Gamer',
          'Fone Bluetooth Anker',
          'Garrafa Térmica Stanley',
          'Cadeira Ergonômica Office',
        ].map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={isMining}
            onClick={() => handleQuickSearch(tag)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 text-slate-600 rounded-full font-medium transition cursor-pointer border border-slate-100 disabled:opacity-50"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
