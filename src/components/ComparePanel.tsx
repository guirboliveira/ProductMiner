import { MLProduct } from '../types';
import { Scale, Trash2, Check, X, ShieldCheck, Truck, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface ComparePanelProps {
  products: MLProduct[];
  onRemoveCompare: (productId: string) => void;
  onClearCompare: () => void;
  currencySymbol: string;
}

export default function ComparePanel({
  products,
  onRemoveCompare,
  onClearCompare,
  currencySymbol,
}: ComparePanelProps) {
  if (products.length === 0) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencySymbol === 'R$' ? 'BRL' : 'USD',
    })
      .format(val)
      .replace('BRL', currencySymbol)
      .replace('USD', currencySymbol);
  };

  // Build a distinct list of common technical attribute names to compare
  const getCommonAttributes = () => {
    const allAttrNames = new Set<string>();
    products.forEach((p) => {
      (p.attributes || []).slice(0, 5).forEach((attr) => {
        allAttrNames.add(attr.name);
      });
    });
    return Array.from(allAttrNames).slice(0, 5);
  };

  const commonAttributes = getCommonAttributes();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6" id="compare-panel-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Scale className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Comparador de Especificações</h3>
            <p className="text-xs text-slate-400">Análise de atributos lado a lado</p>
          </div>
        </div>

        <button
          onClick={onClearCompare}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
        >
          Limpar Todos ({products.length})
        </button>
      </div>

      {/* Comparison Grid Scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {products.map((p, idx) => {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={p.id}
                className="w-72 p-4 border border-slate-100 rounded-xl bg-slate-50/30 flex flex-col justify-between gap-4 relative hover:border-slate-200 transition"
              >
                {/* Remove badge */}
                <button
                  onClick={() => onRemoveCompare(p.id)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition hover:shadow-xs cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Product Meta */}
                <div className="space-y-3">
                  <div className="h-28 w-full bg-white rounded-lg border border-slate-100 p-2 flex items-center justify-center">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 line-clamp-2 min-h-8">
                      {p.title}
                    </h4>
                    <span className="text-base font-black text-slate-900 block">
                      {formatCurrency(p.price)}
                    </span>
                  </div>
                </div>

                {/* Logistics & Conditions specs */}
                <div className="space-y-2 pt-3 border-t border-slate-100/60 text-[11px] text-slate-600 font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Condição</span>
                    <span className="capitalize">{p.condition === 'new' ? 'Novo' : 'Usado'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Frete Grátis</span>
                    <span>
                      {p.shipping.free_shipping ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 inline-block" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-500 inline-block" />
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Volume Vendido</span>
                    <span>{p.sold_quantity ? `+${p.sold_quantity}` : '-'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vendedor</span>
                    <span className="truncate max-w-[120px]">{p.seller.nickname}</span>
                  </div>
                </div>

                {/* Technical attribute highlights */}
                <div className="space-y-2 pt-3 border-t border-slate-100/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Atributos Principais
                  </span>
                  {commonAttributes.map((attrName) => {
                    const match = (p.attributes || []).find((a) => a.name === attrName);
                    return (
                      <div key={attrName} className="text-[11px] flex flex-col gap-0.5">
                        <span className="text-slate-400 font-medium">{attrName}:</span>
                        <span className="font-semibold text-slate-700 truncate">
                          {match?.value_name || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <a
                    href={p.permalink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="w-full h-9 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    Ver Oferta ↗
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
