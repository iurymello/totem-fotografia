'use client';

import { useTheme } from '@/context/ThemeContext';

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
}

interface Props {
  service: ServiceItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export default function ServiceCard({ service, isSelected, onToggle }: Props) {
  const { theme } = useTheme();

  const getServiceImage = () => {
    if (service.imageUrl) return service.imageUrl;
    const t = service.title.toLowerCase();
    if (t.includes('pré-wedding') || t.includes('casal')) return '/pre-wedding.jpg';
    if (t.includes('making of')) return '/making-of.jpg';
    if (t.includes('álbum')) return '/album.jpg';
    if (t.includes('storymaker')) return '/storymaker.jpg';
    if (service.category === 'Casamento') return '/casamento.jpg';
    if (service.category === '15 anos') return '/15anos.jpg';
    return '/eventos.jpg';
  };

  return (
    <div
      onClick={() => onToggle(service.id)}
      className={`cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-300 flex flex-col justify-between ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white shadow-sm'
      } ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : theme === 'dark'
          ? 'border-gray-800 hover:border-gray-700'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative h-36 w-full bg-gray-800 overflow-hidden">
        <img
          src={getServiceImage()}
          alt={service.title}
          className="w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).src = '/logo.jpg')}
        />
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-sm font-bold mb-1 leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {service.title}
          </h3>
          {service.description && (
            <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{service.description}</p>
          )}
        </div>

        <div className={`flex items-center justify-between border-t pt-3 mt-1 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <span className="text-base font-black text-amber-500">
            {Number(service.price) === 0 ? 'Grátis' : `R$ ${Number(service.price).toFixed(2)}`}
          </span>
          <button
            className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
              isSelected
                ? 'bg-amber-400 text-gray-950'
                : theme === 'dark'
                ? 'bg-gray-800 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isSelected ? '✓ Adicionado' : '+ Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
