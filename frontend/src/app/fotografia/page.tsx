'use client';

import React, { useState, useEffect } from 'react';

const WHATSAPP_PHONE = "5521999276478";
const TOTEM_URL = "https://iurymello.com.br";

interface PortfolioItem {
  id: number;
  title: string;
  date: string;
  category: string;
  categoryLabel: string;
  img: string;
  desc: string;
  photos: string[];
}

const initialPortfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "Casamento Flávia & Léo",
    date: "11/11/2026",
    category: "casamento",
    categoryLabel: "Casamento ao Ar Livre",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    desc: "Cerimônia emocionante com luz natural ao pôr do sol e recepção intimista.",
    photos: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 2,
    title: "15 Anos Laura",
    date: "20/05/2025",
    category: "15anos",
    categoryLabel: "Debutante & Balada",
    img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    desc: "A valsa clássica de princesa unida à energia contagiante da pista de dança.",
    photos: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 3,
    title: "Casamento Jéssica & Gabriel",
    date: "14/09/2026",
    category: "casamento",
    categoryLabel: "Casamento Clássico",
    img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    desc: "Elegância atemporal, making of dos dois noivos e momentos sinceros da família.",
    photos: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 4,
    title: "Ensaio Nathalia & Bruno",
    date: "05/08/2026",
    category: "ensaio",
    categoryLabel: "Ensaio Pré-Wedding",
    img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
    desc: "Conexão verdadeira sem poses forçadas entre a natureza e a luz dourada.",
    photos: [
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
    ]
  }
];

export default function FotografiaPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedShowcase, setSelectedShowcase] = useState<PortfolioItem | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Modal Área do Cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientCode, setClientCode] = useState('');

  const heroSlides = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=80",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=2000&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const filteredItems = activeCategory === 'all' 
    ? initialPortfolioItems 
    : initialPortfolioItems.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-200 antialiased selection:bg-[#c5a059] selection:text-black">
      
      {/* HEADER PRINCIPAL */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#15181e]/85 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.2em] text-white font-semibold uppercase group-hover:text-[#e4c988] transition-colors">
              Iury Mello
            </span>
            <span className="text-[10px] sm:text-[11px] tracking-[0.4em] text-[#c5a059] uppercase font-light -mt-1">
              Fotografia
            </span>
          </div>
        </a>

        {/* NAVEGAÇÃO DESKTOP */}
        <nav className="hidden md:flex items-center space-x-7 text-xs lg:text-sm tracking-wider uppercase font-medium text-zinc-300">
          <a href="#portfolio" className="hover:text-[#c5a059] transition-colors">Portfólio</a>
          <a href={TOTEM_URL} className="text-[#e4c988] hover:text-[#c5a059] transition-colors flex items-center gap-1.5 font-semibold">
            <svg className="w-4 h-4 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            Orçamento (Totem)
          </a>
          <a href="#depoimentos" className="hover:text-[#c5a059] transition-colors">Depoimentos</a>
          <a href="#sobre" className="hover:text-[#c5a059] transition-colors">Quem Sou Eu</a>
          <a href="#faq" className="hover:text-[#c5a059] transition-colors">Dúvidas</a>
        </nav>

        {/* BOTÃO ÁREA DO CLIENTE */}
        <button 
          onClick={() => setShowClientModal(true)}
          className="px-4 py-2 rounded-full border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition duration-300 flex items-center gap-2 text-xs font-semibold uppercase">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Área do Cliente
        </button>
      </header>

      {/* HERO BANNER SLIDESHOW */}
      <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <img src={heroSlides[heroIndex]} alt="Iury Mello Fotografia" className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/40 to-black/60 z-10" />

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-[#c5a059]/30 text-[#e4c988] text-[11px] sm:text-xs uppercase tracking-[0.2em] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#c5a059] animate-ping"></span>
            <span>Eternize os Seus Melhores Momentos</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white font-normal leading-none tracking-tight mb-4 drop-shadow-lg">
            Iury Mello
          </h1>
          <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-[#e4c988] font-normal mb-8 tracking-wide">
            Fotografia de Casamentos &amp; 15 Anos
          </p>

          <p className="text-zinc-300 text-sm sm:text-base md:text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
            Trabalho com agenda limitada para garantir dedicação total a cada história. Imagens atemporais, sem limites de fotos e com entrega em alta resolução.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={TOTEM_URL} 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#c5a059] to-[#9e7d38] text-black font-semibold text-xs sm:text-sm tracking-wider uppercase hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20">
              <span>Simular Orçamento no Totem</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
            <a href="#portfolio" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm tracking-wider uppercase transition">
              Ver Portfólio dos Casais
            </a>
          </div>
        </div>

        {/* NAVEGAÇÃO DOS SLIDES */}
        <div className="absolute bottom-8 z-20 flex items-center gap-2">
          {heroSlides.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setHeroIndex(idx)} 
              className={`h-2.5 rounded-full transition-all ${idx === heroIndex ? 'w-6 bg-[#c5a059]' : 'w-2.5 bg-white/40'}`} 
            />
          ))}
        </div>
      </section>

      {/* SEÇÃO PORTFÓLIO / GALERIAS */}
      <section id="portfolio" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#c5a059] uppercase text-xs tracking-[0.3em] font-semibold">Resumo dos Últimos Trabalhos</span>
          <h2 className="font-serif text-3xl sm:text-5xl text-white mt-2 mb-3">Histórias Que Contamos</h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Clique em qualquer evento para abrir o resumo com as <strong>fotos marcantes</strong> da celebração.
          </p>

          {/* FILTROS POR CATEGORIA */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
            <button 
              onClick={() => setActiveCategory('all')} 
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${activeCategory === 'all' ? 'bg-[#c5a059] text-black' : 'bg-white/5 text-zinc-300 hover:text-white'}`}>
              Todos os Momentos
            </button>
            <button 
              onClick={() => setActiveCategory('casamento')} 
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${activeCategory === 'casamento' ? 'bg-[#c5a059] text-black' : 'bg-white/5 text-zinc-300 hover:text-white'}`}>
              Casamentos
            </button>
            <button 
              onClick={() => setActiveCategory('15anos')} 
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${activeCategory === '15anos' ? 'bg-[#c5a059] text-black' : 'bg-white/5 text-zinc-300 hover:text-white'}`}>
              15 Anos &amp; Debutantes
            </button>
            <button 
              onClick={() => setActiveCategory('ensaio')} 
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${activeCategory === 'ensaio' ? 'bg-[#c5a059] text-black' : 'bg-white/5 text-zinc-300 hover:text-white'}`}>
              Ensaios Pré-Evento
            </button>
          </div>
        </div>

        {/* GRID DOS TRABALHOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedShowcase(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#15181e] cursor-pointer border border-white/10 hover:border-[#c5a059]/50 transition-all duration-500 shadow-xl">
              <div className="aspect-[4/5] overflow-hidden bg-zinc-900 relative">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] bg-black/60 px-2.5 py-1 rounded-full border border-[#c5a059]/30">{item.categoryLabel}</span>
                    <span className="text-[10px] text-zinc-300 font-mono bg-white/10 px-2 py-0.5 rounded">{item.date}</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-medium group-hover:text-[#e4c988] transition-colors">{item.title}</h3>
                  <p className="text-xs text-zinc-300 mt-1 opacity-90 line-clamp-2">{item.desc}</p>
                  <span className="inline-block mt-3 text-[11px] text-[#c5a059] font-semibold tracking-wider uppercase group-hover:underline">
                    Ver fotos deste evento →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-14">
          <span className="text-[#c5a059] uppercase text-xs tracking-[0.3em] font-semibold">Carinho &amp; Confiança</span>
          <h2 className="font-serif text-3xl sm:text-5xl text-white mt-1">O Que Dizem os Nossos Noivos &amp; Famílias</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#15181e] p-7 rounded-2xl border border-white/10 hover:border-[#c5a059]/40 transition">
            <div className="text-[#c5a059] text-sm mb-3">★★★★★</div>
            <p className="text-zinc-300 text-sm italic leading-relaxed mb-6">
              "O Iury conseguiu captar a nossa essência de um jeito único. No dia estávamos super nervosos, mas a leveza e calma dele nos deixaram completamente à vontade!"
            </p>
            <h5 className="text-white text-sm font-semibold">Flávia &amp; Léo</h5>
            <span className="text-[11px] text-zinc-400">Casamento em Niterói</span>
          </div>

          <div className="bg-[#15181e] p-7 rounded-2xl border border-white/10 hover:border-[#c5a059]/40 transition">
            <div className="text-[#c5a059] text-sm mb-3">★★★★★</div>
            <p className="text-zinc-300 text-sm italic leading-relaxed mb-6">
              "A festa de 15 anos da minha filha foi mágica e ter o Iury com a gente fez toda diferença. Não perderam um segundo da valsa e da balada!"
            </p>
            <h5 className="text-white text-sm font-semibold">Laura &amp; Família</h5>
            <span className="text-[11px] text-zinc-400">15 Anos</span>
          </div>

          <div className="bg-[#15181e] p-7 rounded-2xl border border-white/10 hover:border-[#c5a059]/40 transition">
            <div className="text-[#c5a059] text-sm mb-3">★★★★★</div>
            <p className="text-zinc-300 text-sm italic leading-relaxed mb-6">
              "Pontualidade impecável, olhar atento aos detalhes e sem poses forçadas. O pacote pegou reações dos nossos pais que nem tínhamos visto!"
            </p>
            <h5 className="text-white text-sm font-semibold">Jéssica &amp; Gabriel</h5>
            <span className="text-[11px] text-zinc-400">Casamento na Serra</span>
          </div>
        </div>
      </section>

      {/* QUEM SOU EU */}
      <section id="sobre" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#c5a059]/30">
              <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1000&q=80" alt="Iury Mello" className="w-full h-[480px] object-cover" />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-[#c5a059] uppercase text-xs tracking-[0.3em] font-semibold">Quem Sou Eu</span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white leading-tight">
              "Mais do que fotografar, é sentir e traduzir cada emoção em imagens que permanecem vivas com o tempo."
            </h2>
            <p className="text-zinc-300 text-base leading-relaxed">
              Olá, eu sou <strong class="text-[#c5a059]">Iury Mello</strong>, marido, pai do Antônio e apaixonado por contar histórias através da fotografia. Acredito que a fotografia vai além da técnica: ela está na sensibilidade e no cuidado com cada detalhe.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[#15181e]/50 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-[#c5a059] uppercase text-xs tracking-[0.3em] font-semibold">Dúvidas Frequentes</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mt-1 mb-8">Perguntas Frequentes</h2>

          <div className="space-y-4 text-left">
            <div className="p-6 rounded-xl bg-black/40 border border-white/5">
              <h4 className="text-white font-semibold mb-2">Como funciona a entrega das fotos?</h4>
              <p className="text-xs text-zinc-400">Você recebe o código de acesso exclusivo para entrar na Área do Cliente deste site e baixar todas as fotos tratadas em alta resolução.</p>
            </div>
            <div className="p-6 rounded-xl bg-black/40 border border-white/5">
              <h4 className="text-white font-semibold mb-2">Com quanta antecedência devo reservar?</h4>
              <p className="text-xs text-zinc-400">Recomendo reservar de 6 a 12 meses antes para garantir a exclusividade da sua data na agenda, pois só atendo 1 evento por dia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0d0f12] py-12 px-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Iury Mello Fotografia. Todos os direitos reservados.</p>
      </footer>

      {/* BOTÃO FLUTUANTE DO WHATSAPP */}
      <a 
        href={`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent("Olá Iury! Gostaria de consultar disponibilidade na sua agenda.")}`}
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl hover:scale-105 transition duration-300">
        <div className="relative">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          <span class="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
        </div>
        <div class="hidden sm:flex flex-col text-left">
          <span class="text-[10px] uppercase font-bold text-emerald-200">Online • Atendimento</span>
          <span class="text-xs font-semibold text-white">Consultar Minha Data</span>
        </div>
      </a>

      {/* MODAL SHOWCASE DO EVENTO SELECIONADO */}
      {selectedShowcase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#1c212a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#c5a059]/30">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#c5a059] font-bold">{selectedShowcase.categoryLabel}</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white">{selectedShowcase.title}</h3>
                <p className="text-xs text-zinc-400">{selectedShowcase.date}</p>
              </div>
              <button onClick={() => setSelectedShowcase(null)} className="text-zinc-400 hover:text-white p-2 text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-zinc-300">{selectedShowcase.desc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedShowcase.photos.map((photo, idx) => (
                  <div key={idx} onClick={() => setLightboxImg(photo)} className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-[#c5a059] transition">
                    <img src={photo} alt="" className="w-full h-full object-cover hover:scale-110 transition duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg border border-white/20" />
        </div>
      )}

      {/* MODAL ÁREA DO CLIENTE */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c212a] border border-[#c5a059]/40 p-8 rounded-2xl max-w-md w-full relative text-center">
            <button onClick={() => setShowClientModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-2xl font-serif text-white mb-2">Área do Cliente</h3>
            <p className="text-xs text-gray-400 mb-6">Digite o código de acesso enviado pelo Iury:</p>

            <input 
              type="text" 
              placeholder="Ex: CASAMENTO-BEATRIZ" 
              value={clientCode} 
              onChange={(e) => setClientCode(e.target.value.toUpperCase())} 
              className="w-full text-center p-3 rounded-xl bg-black/50 border border-[#c5a059]/40 text-[#c5a059] font-mono font-bold mb-4 focus:outline-none" 
            />

            <button 
              onClick={() => {
                alert('Acessando galeria do cliente...');
                setShowClientModal(false);
              }} 
              className="w-full py-3 rounded-xl bg-[#c5a059] text-black font-bold uppercase text-xs">
              Acessar Minha Galeria
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
