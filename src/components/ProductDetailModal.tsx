import { MLProduct, MLAttribute } from '../types';
import { useEffect, useState } from 'react';
import {
  fetchProductDetails,
  fetchProductDescription,
  getHighResImage,
} from '../utils/mercadoLibre';
import { X, Loader2, Image as ImageIcon, Sparkles, MapPin, ShieldCheck, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: MLProduct | null;
  onClose: () => void;
  currencySymbol: string;
}

export default function ProductDetailModal({
  product,
  onClose,
  currencySymbol,
}: ProductDetailModalProps) {
  const [details, setDetails] = useState<Partial<MLProduct>>({});
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (!product) return;

    // Reset states
    setDetails({});
    setDescription('');
    setActiveImage(product.thumbnail);
    setLoading(true);

    async function loadExtraData() {
      try {
        const [extraDetails, descText] = await Promise.all([
          fetchProductDetails(product!.id),
          fetchProductDescription(product!.id),
        ]);

        setDetails(extraDetails);
        setDescription(descText);

        if (extraDetails.pictures && extraDetails.pictures.length > 0) {
          setActiveImage(getHighResImage(extraDetails.pictures[0].url));
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExtraData();
  }, [product]);

  if (!product) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencySymbol === 'R$' ? 'BRL' : 'USD',
    })
      .format(val)
      .replace('BRL', currencySymbol)
      .replace('USD', currencySymbol);
  };

  // Extract critical attributes (Brand, Model, Weight, etc.)
  const attributes = details.attributes || product.attributes || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end" id="product-detail-modal-root">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900"
        />

        {/* Sliding Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ID do Produto: {product.id}
              </span>
              <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{product.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Visuals & Pictures */}
            <div className="space-y-3">
              <div className="h-72 w-full border border-slate-100 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-4 relative">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs">Sem imagem disponível</span>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-xs">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              {/* Thumbnail selector */}
              {details.pictures && details.pictures.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {details.pictures.slice(0, 7).map((pic) => {
                    const highRes = getHighResImage(pic.url);
                    const isSelected = activeImage === highRes;
                    return (
                      <button
                        key={pic.id}
                        onClick={() => setActiveImage(highRes)}
                        className={`h-12 w-12 rounded-lg border flex items-center justify-center p-1 bg-white flex-shrink-0 transition cursor-pointer ${
                          isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={highRes}
                          alt="preview"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Pricing & Stock Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">
                  Preço Praticado
                </span>
                <span className="text-2xl font-black text-slate-800">{formatCurrency(product.price)}</span>
                {product.original_price && product.original_price > product.price && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrency(product.original_price)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">
                    Disponibilidade
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin inline-block text-slate-400" />
                    ) : (
                      `${details.available_quantity || product.available_quantity || 0} unidades`
                    )}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-blue-600 mt-2">
                  {product.sold_quantity ? `+${product.sold_quantity} vendidos` : 'Volume não informado'}
                </div>
              </div>
            </div>

            {/* Seller Reputation and Shipping */}
            <div className="p-4 rounded-xl border border-slate-100 space-y-3.5 bg-slate-50/20">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">Reputação do Vendedor</h4>
                  <p className="text-xs font-medium text-slate-500">{product.seller.nickname}</p>
                </div>
                {product.seller.seller_reputation?.level_id && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      product.seller.seller_reputation.level_id.includes('green')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Reputação Verde (Top)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100/60 text-slate-600 font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {product.address?.city_name || 'Origem não informada'}, {product.address?.state_name || ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <span>{details.warranty || 'Garantia de fábrica'}</span>
                </div>
              </div>
            </div>

            {/* Technical Attributes Panel */}
            {attributes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Especificações Técnicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attributes.slice(0, 10).map((attr) => (
                    <div
                      key={attr.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-0.5"
                    >
                      <span className="text-[10px] text-slate-400 font-bold">{attr.name}</span>
                      <span className="text-xs font-semibold text-slate-700">{attr.value_name || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Description */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descrição do Anúncio
              </h4>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Carregando descrição completa...</span>
                  </div>
                ) : description ? (
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Sem descrição de texto fornecida pelo vendedor.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-medium">Análise extraída via API pública</span>
            <a
              href={product.permalink}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-200/50"
            >
              Comprar / Ver no Mercado Livre ↗
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
