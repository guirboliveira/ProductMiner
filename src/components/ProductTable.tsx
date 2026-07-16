import { MLProduct } from '../types';
import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Search,
  Eye,
  Check,
  Scale,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ProductTableProps {
  products: MLProduct[];
  onSelectProduct: (productId: string) => void;
  selectedCompareIds: string[];
  onToggleCompare: (productId: string) => void;
  currencySymbol: string;
  selectedExtractIds?: string[];
  onToggleExtract?: (productId: string) => void;
  onToggleAllExtract?: (productIds: string[]) => void;
  onExtractDetails?: (productIds: string[]) => void;
  isExtractingDetails?: boolean;
}

export default function ProductTable({
  products,
  onSelectProduct,
  selectedCompareIds,
  onToggleCompare,
  currencySymbol,
  selectedExtractIds = [],
  onToggleExtract,
  onToggleAllExtract,
  onExtractDetails,
  isExtractingDetails = false,
}: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'sales_desc' | 'none'>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Sort Mined Results
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter by internal search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.seller.nickname.toLowerCase().includes(term)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'sales_desc') {
      result.sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0));
    }

    return result;
  }, [products, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const exportProductsToCSV = (list: MLProduct[]) => {
    const headers = [
      'ID',
      'Titulo',
      'Preco',
      'Moeda',
      'Condicao',
      'Frete Gratis',
      'Quantidade Vendida',
      'Vendedor',
      'URL',
      'Garantia',
      'Descricao',
      'Especificacoes'
    ];

    const rows = list.map((p) => {
      const attributesStr = (p.attributes || [])
        .map(a => `${a.name}: ${a.value_name || ''}`)
        .join('; ');
      return [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.price,
        p.currency_id,
        p.condition,
        p.shipping.free_shipping ? 'Sim' : 'Nao',
        p.sold_quantity || 0,
        `"${p.seller.nickname.replace(/"/g, '""')}"`,
        p.permalink,
        `"${(p.warranty || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${attributesStr.replace(/"/g, '""')}"`,
      ];
    });

    const csvString = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minerador_ml_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportProductsToJSON = (list: MLProduct[]) => {
    const jsonString = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minerador_ml_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to CSV
  const exportToCSV = () => {
    exportProductsToCSV(processedProducts);
  };

  // Export to JSON
  const exportToJSON = () => {
    exportProductsToJSON(processedProducts);
  };

  const exportSelectedCSV = () => {
    const selectedProducts = processedProducts.filter(p => selectedExtractIds.includes(p.id));
    exportProductsToCSV(selectedProducts);
  };

  const exportSelectedJSON = () => {
    const selectedProducts = processedProducts.filter(p => selectedExtractIds.includes(p.id));
    exportProductsToJSON(selectedProducts);
  };

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="product-table-wrapper">
      {/* Search, Filter, and Export bar / Bulk Actions Bar */}
      {selectedExtractIds.length > 0 ? (
        <div className="p-4 bg-blue-605 text-white bg-blue-600 flex flex-col sm:flex-row gap-3 items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
              {selectedExtractIds.length} selecionado(s)
            </span>
            <span className="text-xs font-semibold">Extração e exportação em lote:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onExtractDetails?.(selectedExtractIds)}
              disabled={isExtractingDetails}
              className="h-9 px-4 bg-white text-blue-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed"
            >
              {isExtractingDetails ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Extraindo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Extrair Detalhes</span>
                </>
              )}
            </button>
            
            <button
              onClick={exportSelectedCSV}
              className="h-9 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="Exportar itens selecionados para CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
            
            <button
              onClick={exportSelectedJSON}
              className="h-9 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="Exportar itens selecionados para JSON"
            >
              <span>JSON</span>
            </button>

            <button
              onClick={() => onToggleAllExtract?.([])}
              className="h-9 px-3 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar nesta mineração..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 cursor-pointer"
              >
                <option value="none">Relevância</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="sales_desc">Mais Vendidos</option>
              </select>
            </div>

            {/* Export action dropdown */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={exportToCSV}
                className="h-10 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                title="Exportar como arquivo CSV compatível com Excel"
                id="export-csv-button"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportToJSON}
                className="h-10 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                title="Exportar dados estruturados como JSON"
                id="export-json-button"
              >
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-4 px-4 text-center w-12">
                <input
                  type="checkbox"
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedExtractIds.includes(p.id))}
                  onChange={(e) => {
                    if (onToggleAllExtract) {
                      const pageIds = paginatedProducts.map(p => p.id);
                      if (e.target.checked) {
                        const merged = Array.from(new Set([...selectedExtractIds, ...pageIds]));
                        onToggleAllExtract(merged);
                      } else {
                        const filtered = selectedExtractIds.filter(id => !pageIds.includes(id));
                        onToggleAllExtract(filtered);
                      }
                    }
                  }}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                />
              </th>
              <th className="py-4 px-6 text-center w-12">Comparar</th>
              <th className="py-4 px-4 w-16">Foto</th>
              <th className="py-4 px-4">Produto</th>
              <th className="py-4 px-4">Vendedor</th>
              <th className="py-4 px-4 text-right">Preço</th>
              <th className="py-4 px-4 text-center">Frete</th>
              <th className="py-4 px-4 text-center">Vendas</th>
              <th className="py-4 px-6 text-center w-28">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((p) => {
                const isSelectedForCompare = selectedCompareIds.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      selectedExtractIds.includes(p.id)
                        ? 'bg-blue-50/20'
                        : isSelectedForCompare
                        ? 'bg-blue-50/10'
                        : ''
                    }`}
                  >
                    {/* Extract Selection */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedExtractIds.includes(p.id)}
                        onChange={() => onToggleExtract?.(p.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                      />
                    </td>

                    {/* Compare Selection */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onToggleCompare(p.id)}
                        className={`mx-auto h-5 w-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          isSelectedForCompare
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'border-slate-300 hover:border-blue-500 bg-white'
                        }`}
                        title="Adicionar à comparação"
                      >
                        {isSelectedForCompare && <Check className="h-3 w-3 stroke-[3px]" />}
                      </button>
                    </td>

                    {/* Image */}
                    <td className="py-4 px-4">
                      <div className="h-11 w-11 rounded-lg border border-slate-100 bg-white flex items-center justify-center overflow-hidden p-1">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1 hover:text-blue-600 transition cursor-pointer" onClick={() => onSelectProduct(p.id)}>
                          {p.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider ${
                              p.condition === 'new'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {p.condition === 'new' ? 'Novo' : 'Usado'}
                          </span>
                          {p.official_store_id && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-semibold flex items-center gap-0.5">
                              <Sparkles className="h-2 w-2" />
                              Loja Oficial
                            </span>
                          )}
                          {p.description !== undefined && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold flex items-center gap-0.5" title="Especificações e descrição completa extraídas">
                              <Sparkles className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500 animate-pulse" />
                              Extraído
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="py-4 px-4 max-w-[120px] truncate">
                      <span className="text-xs font-medium text-slate-500">{p.seller.nickname}</span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(p.price)}</span>
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-[10px] text-slate-400 line-through block">
                            {formatCurrency(p.original_price)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Shipping Badge */}
                    <td className="py-4 px-4 text-center">
                      {p.shipping.free_shipping ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold">
                          Grátis
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Pago</span>
                      )}
                    </td>

                    {/* Sold Quantity */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {p.sold_quantity !== undefined && p.sold_quantity > 0 ? (
                        <span className="text-xs font-bold text-blue-600">{p.sold_quantity}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectProduct(p.id)}
                          className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 flex items-center justify-center transition cursor-pointer"
                          title="Análise Detalhada"
                          id={`view-details-${p.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={p.permalink}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 flex items-center justify-center transition cursor-pointer"
                          title="Abrir no Mercado Livre"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  Nenhum produto atende aos filtros aplicados nesta mineração.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, processedProducts.length)} de{' '}
            {processedProducts.length} itens
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
              .map((page, index, array) => {
                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && <span className="text-slate-300 text-xs px-1">...</span>}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
