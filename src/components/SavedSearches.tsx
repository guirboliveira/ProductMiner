import { SavedMine } from '../types';
import { History, Play, Trash2, Calendar } from 'lucide-react';
import { ML_SITES } from '../utils/mercadoLibre';

interface SavedSearchesProps {
  history: SavedMine[];
  onLoadSearch: (mine: SavedMine) => void;
  onDeleteSearch: (id: string) => void;
}

export default function SavedSearches({
  history,
  onLoadSearch,
  onDeleteSearch,
}: SavedSearchesProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4" id="saved-searches-container">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
          <History className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 font-sans">Histórico de Minerações</h3>
          <p className="text-xs text-slate-400">Suas últimas varreduras na API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.map((mine) => {
          const site = ML_SITES.find((s) => s.id === mine.filters.siteId);
          const date = new Date(mine.timestamp).toLocaleDateString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={mine.id}
              className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 hover:border-slate-200 transition flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">{mine.name}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 flex-shrink-0">
                    {site?.name.split(' ')[1] || '🌎'} {mine.filters.siteId}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {date}
                  </span>
                  <span>•</span>
                  <span>{mine.productCount} itens extraídos</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onLoadSearch(mine)}
                  className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Rodar mineração novamente"
                  id={`reload-mine-${mine.id}`}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </button>
                <button
                  onClick={() => onDeleteSearch(mine.id)}
                  className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center transition cursor-pointer"
                  title="Remover do histórico"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
