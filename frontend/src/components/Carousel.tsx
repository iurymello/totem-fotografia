'use client';

import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
}

export default function Carousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  if (banners.length === 0) return null;

  return (
    <div className="relative h-64 sm:h-80 w-full rounded-3xl overflow-hidden border-2 border-amber-400/20 shadow-2xl">
      <img
        src={banners[index]?.imageUrl}
        alt="Destaque"
        className="w-full h-full object-cover transition-all duration-700"
        onError={(e) => ((e.target as HTMLImageElement).src = '/casamento.jpg')}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent flex items-end p-6">
        <span className="text-lg font-extrabold text-amber-400 drop-shadow-md">
          {banners[index]?.title || 'Fotografia de Alto Padrão'}
        </span>
      </div>
    </div>
  );
}