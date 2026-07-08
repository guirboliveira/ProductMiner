import { MLProduct } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ChartsPanelProps {
  products: MLProduct[];
  currencySymbol: string;
}

export default function ChartsPanel({ products, currencySymbol }: ChartsPanelProps) {
  if (products.length === 0) return null;

  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Let's create 5 buckets for price distribution
  const bucketCount = 5;
  const bucketSize = priceRange / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const start = minPrice + i * bucketSize;
    const end = start + bucketSize;
    return {
      rangeStart: start,
      rangeEnd: end,
      rangeLabel: `${currencySymbol}${Math.round(start)} - ${currencySymbol}${Math.round(end)}`,
      quantidade: 0,
    };
  });

  products.forEach((p) => {
    let bucketIndex = Math.floor((p.price - minPrice) / bucketSize);
    if (bucketIndex >= bucketCount) {
      bucketIndex = bucketCount - 1; // Safeguard for exact max price
    }
    if (bucketIndex < 0) bucketIndex = 0;
    buckets[bucketIndex].quantidade += 1;
  });

  // Calculate Shipping Data
  const freeShipping = products.filter((p) => p.shipping.free_shipping).length;
  const paidShipping = products.length - freeShipping;
  const shippingData = [
    { name: 'Frete Grátis', value: freeShipping, color: '#3b82f6' },
    { name: 'Frete Pago', value: paidShipping, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  // Calculate Condition Data
  const newItems = products.filter((p) => p.condition === 'new').length;
  const usedItems = products.length - newItems;
  const conditionData = [
    { name: 'Novos', value: newItems, color: '#10b981' },
    { name: 'Usados/Recond.', value: usedItems, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-panel-wrapper">
      {/* Price Distribution Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Distribuição de Preços</h3>
            <p className="text-xs text-slate-400">Análise de concorrência por faixas de preço</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="rangeLabel"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} anúncios`, 'Quantidade']}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Shipping and Condition Pies */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <PieIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Proporções de Logística e Uso</h3>
            <p className="text-xs text-slate-400">Comportamento dos anúncios no mercado</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 items-center">
          {/* Shipping Pie */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-500 mb-2 block">Frete</span>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shippingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {shippingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value} itens`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-center">
              {shippingData.map((d) => (
                <div key={d.name} className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-slate-600 font-medium">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Condition Pie */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-500 mb-2 block">Condição</span>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {conditionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value} itens`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-center">
              {conditionData.map((d) => (
                <div key={d.name} className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-slate-600 font-medium">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
