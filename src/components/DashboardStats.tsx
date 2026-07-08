import { MiningStats } from '../types';
import { TrendingUp, DollarSign, Scale, Truck, ArrowDown, ArrowUp, Store } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  stats: MiningStats;
  currencySymbol: string;
}

export default function DashboardStats({ stats, currencySymbol }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencySymbol === 'R$' ? 'BRL' : 'USD',
    })
      .format(value)
      .replace('BRL', currencySymbol)
      .replace('USD', currencySymbol);
  };

  const statItems = [
    {
      title: 'Produtos Minerados',
      value: stats.totalItems,
      subtitle: 'Total analisado na API',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Média de Preço',
      value: formatCurrency(stats.averagePrice),
      subtitle: `Centro médio de preços`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Mediana dos Preços',
      value: formatCurrency(stats.medianPrice),
      subtitle: 'Elimina anúncios extremos',
      icon: Scale,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Taxa de Frete Grátis',
      value: `${stats.freeShippingPercentage.toFixed(1)}%`,
      subtitle: `${stats.freeShippingCount} de ${stats.totalItems} anúncios`,
      icon: Truck,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  const extremeItems = [
    {
      title: 'Oferta Mais Barata',
      name: stats.minPriceItem?.title || 'Nenhum',
      price: stats.minPriceItem ? formatCurrency(stats.minPriceItem.price) : '-',
      link: stats.minPriceItem?.permalink || '#',
      seller: stats.minPriceItem?.seller.nickname || 'Desconhecido',
      icon: ArrowDown,
      color: 'border-emerald-100 bg-emerald-50/20 text-emerald-700',
    },
    {
      title: 'Anúncio Mais Caro',
      name: stats.maxPriceItem?.title || 'Nenhum',
      price: stats.maxPriceItem ? formatCurrency(stats.maxPriceItem.price) : '-',
      link: stats.maxPriceItem?.permalink || '#',
      seller: stats.maxPriceItem?.seller.nickname || 'Desconhecido',
      icon: ArrowUp,
      color: 'border-rose-100 bg-rose-50/20 text-rose-700',
    },
  ];

  return (
    <div className="space-y-6" id="dashboard-stats-wrapper">
      {/* 4 Core metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.title}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-start justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {item.title}
                </span>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{item.value}</h3>
                <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl border ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Extreme values / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extremeItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              initial={{ opacity: 0, x: index === 0 ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              key={item.title}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{item.title}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900">{item.price}</span>
                  <span className="text-xs text-slate-400 font-sans">vendedor: {item.seller}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Análise de competitividade</span>
                <a
                  href={item.link}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver no Mercado Livre ↗
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
