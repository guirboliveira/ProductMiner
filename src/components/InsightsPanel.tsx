import { MLProduct } from '../types';
import { Tag, Users, BadgePercent, Flame, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InsightsPanelProps {
  products: MLProduct[];
  averagePrice: number;
  currencySymbol: string;
}

export default function InsightsPanel({ products, averagePrice, currencySymbol }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'keywords' | 'competitors' | 'deals' | 'popular'>('keywords');

  if (products.length === 0) return null;

  // 1. Keyword Frequency Analyzer
  const getTopKeywords = () => {
    const stopWords = new Set([
      'de', 'do', 'da', 'em', 'para', 'com', 'um', 'uma', 'o', 'a', 'e', 'os', 'as', 'no', 'na', 'nos', 'nas',
      'por', 'para', 'sem', 'sob', 'sobre', 'atras', 'entre', 'comigo', 'consigo', 'te', 'ti', 'se', 'sua', 'seu',
      'suas', 'seus', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'of', 'the', 'and', 'for', 'with', 'to'
    ]);

    const wordCounts: { [key: string]: number } = {};

    products.forEach((p) => {
      const words = p.title
        .toLowerCase()
        .replace(/[^\w\sÀ-ÿ]/g, '') // Remove punctuation
        .split(/\s+/);

      words.forEach((word) => {
        if (word.length > 2 && !stopWords.has(word) && isNaN(Number(word))) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  // 2. Competitor / Top Sellers Analysis
  const getTopSellers = () => {
    const sellers: { [key: string]: { count: number; minPrice: number; maxPrice: number } } = {};

    products.forEach((p) => {
      const nick = p.seller.nickname;
      if (!sellers[nick]) {
        sellers[nick] = { count: 0, minPrice: p.price, maxPrice: p.price };
      }
      sellers[nick].count += 1;
      if (p.price < sellers[nick].minPrice) sellers[nick].minPrice = p.price;
      if (p.price > sellers[nick].maxPrice) sellers[nick].maxPrice = p.price;
    });

    return Object.entries(sellers)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  };

  // 3. Best Bargains (Precio < 85% of Average, condition new, has free shipping)
  const getBestDeals = () => {
    const threshold = averagePrice * 0.85;
    return products
      .filter((p) => p.price <= threshold && p.condition === 'new')
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
  };

  // 4. Most Popular Products (highest sold_quantity)
  const getMostPopular = () => {
    return [...products]
      .filter((p) => p.sold_quantity !== undefined && p.sold_quantity > 0)
      .sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0))
      .slice(0, 5);
  };

  const topKeywords = getTopKeywords();
  const topSellers = getTopSellers();
  const bestDeals = getBestDeals();
  const mostPopular = getMostPopular();

  const tabs = [
    { id: 'keywords', label: 'Palavras-Chave SEO', icon: Tag },
    { id: 'competitors', label: 'Domínio de Concorrentes', icon: Users },
    { id: 'deals', label: 'Barganhas Subfaturadas', icon: BadgePercent },
    { id: 'popular', label: 'Mais Vendidos', icon: Flame },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencySymbol === 'R$' ? 'BRL' : 'USD',
    })
      .format(val)
      .replace('BRL', currencySymbol)
      .replace('USD', currencySymbol);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="insights-panel-container">
      {/* Tab Navigation header */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'keywords' && (
            <motion.div
              key="keywords"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Termos Relevantes para SEO</h3>
                <p className="text-xs text-slate-400">Palavras mais frequentes usadas nos títulos das listagens de alta conversão.</p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {topKeywords.length > 0 ? (
                  topKeywords.map(([word, count], i) => (
                    <div
                      key={word}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition cursor-default"
                    >
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 capitalize">{word}</span>
                      <span className="text-xs text-slate-400 font-medium">({count}x)</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Poucas palavras encontradas para análise.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'competitors' && (
            <motion.div
              key="competitors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Concorrentes Dominantes</h3>
                <p className="text-xs text-slate-400">Vendedores com maior fatia de anúncios no resultado minerado.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {topSellers.map(([nick, info]) => (
                  <div
                    key={nick}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-2 hover:border-slate-200 transition"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-slate-700 max-w-[70%] truncate">{nick}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                        {info.count} {info.count === 1 ? 'anúncio' : 'anúncios'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Faixa: {formatCurrency(info.minPrice)} ~ {formatCurrency(info.maxPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'deals' && (
            <motion.div
              key="deals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Oportunidades de Compra / Revenda</h3>
                <p className="text-xs text-slate-400">
                  Produtos novos que estão com preço abaixo de 15% em relação à média geral ({formatCurrency(averagePrice)}).
                </p>
              </div>

              <div className="space-y-2.5">
                {bestDeals.length > 0 ? (
                  bestDeals.map((p) => {
                    const discountPercent = ((averagePrice - p.price) / averagePrice) * 100;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-100"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-700 truncate">{p.title}</h4>
                            <p className="text-[10px] text-slate-400">Vendedor: {p.seller.nickname}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-600 block">{formatCurrency(p.price)}</span>
                            <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              -{discountPercent.toFixed(0)}% da média
                            </span>
                          </div>
                          <a
                            href={p.permalink}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition border border-slate-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
                    Nenhum produto novo atende à métrica de barganha (15% abaixo da média) neste minerado.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'popular' && (
            <motion.div
              key="popular"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Campeões de Vendas</h3>
                <p className="text-xs text-slate-400">Listagens com o maior volume histórico de vendas estimado.</p>
              </div>

              <div className="space-y-2.5">
                {mostPopular.length > 0 ? (
                  mostPopular.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-700 truncate">{p.title}</h4>
                          <p className="text-[10px] text-slate-400">Vendedor: {p.seller.nickname}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800 block">{formatCurrency(p.price)}</span>
                          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                            +{p.sold_quantity} vendidos
                          </span>
                        </div>
                        <a
                          href={p.permalink}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition border border-slate-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
                    A API do Mercado Livre não retornou dados de volume vendido para esta categoria nesta consulta.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
