'use client';

import React, { useState, useEffect } from 'react';

const WHATSAPP_PHONE = "5521999276478";

export default function FotografiaPage() {
  const [portalMode, setPortalMode] = useState<'casamento' | 'infantil'>('casamento');
  const [heroIndex, setHeroIndex] = useState(0);
  const [eventType, setEventType] = useState<'casamento' | '15anos' | 'ensaioExclusivo'>('casamento');
  const [coveragePkg, setCoveragePkg] = useState('cas_essencial');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Formulário do cliente
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // Infantil
  const [kidsPkg, setKidsPkg] = useState<'pocket' | 'completa'>('pocket');
  const [kidsAlbum, setKidsAlbum] = useState(false);
  const [kidsPre, setKidsPre] = useState(false);

  // Modais
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientCode, setClientCode] = useState('');
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);

  // Hero Slides
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

  // Cálculos do Orçamento Casamento/15 Anos
  const packagePrices: Record<string, { name: string; price: number }> = {
    cas_mini: { name: "Mini Wedding", price: 1500 },
    cas_essencial: { name: "Essencial (2 Fotógrafos + Ensaio)", price: 3000 },
    cas_completo: { name: "Completo (2 Fotógrafos + Álbum 30x30)", price: 4800 },
    deb_essencial: { name: "Debutante Essencial", price: 1800 },
    deb_master: { name: "Debutante Master (Equipe + Ensaio)", price: 3200 },
    ens_prewedding: { name: "Ensaio Pré-Wedding Avulso", price: 600 }
  };

  const addonPrices: Record<string, { name: string; price: number }> = {
    pre_wedding_extra: { name: "Ensaio Pré-Wedding", price: 600 },
    making_of_noivo: { name: "Making of do Noivo", price: 500 },
    storymaker: { name: "Storymaker para Redes Sociais", price: 500 },
    album_premium_30x30: { name: "Álbum Premium 30x30cm", price: 1900 },
    album_essencial_21x21: { name: "Álbum Essencial 21x21cm", price: 1300 }
  };

  const basePrice = packagePrices[coveragePkg]?.price || 3000;
  const addonsTotal = selectedAddons.reduce((acc, id) => acc + (addonPrices[id]?.price || 0), 0);
  const totalPrice = basePrice + addonsTotal;
  const pixPrice = Math.round(totalPrice * 0.95);

  // Cálculos Infantil
  const kidsBase = kidsPkg === 'pocket' ? 800 : 1000;
  const kidsTotal = kidsBase + (kidsAlbum ? 600 : 0) + (kidsPre ? 400 : 0);
  const kidsPix = Math.round(kidsTotal * 0.95);

  const handleSendWhatsApp = () => {
    if (!clientName) {
      alert("Por favor, digite seu nome antes de enviar!");
      return;
    }
    const pkgName = packagePrices[coveragePkg]?.name || "Pacote";
    let msg = `*SOLICITAÇÃO DE ORÇAMENTO (2026/2027)*\n`;
    msg += `👤 *Nome:* ${clientName}\n`;
    msg += `🎉 *Tipo:* ${eventType}\n`;
    if (eventDate) msg += `📅 *Data:* ${eventDate}\n`;
    if (eventLocation) msg += `📍 *Local:* ${eventLocation}\n`;
    msg += `📦 *Pacote:* ${pkgName} (R$ ${basePrice})\n`;
    msg += `💰 *Total Estimado:* R$ ${totalPrice.toLocaleString('pt-BR')}\n`;
    msg += `💵 *À vista PIX:* R$ ${pixPrice.toLocaleString('pt-BR')}\n\n`;
    msg += `Olá Iury! Gostaria de verificar a disponibilidade na sua agenda!`;

    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`min-h-screen ${portalMode === 'infantil' ? 'bg-white text-slate-800' : 'bg-[#0d0f12] text-gray-200'}`}>
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#15181e]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-wider text-amber-400">IURY MELLO</span>
          <span className="text-xs uppercase tracking-widest text-gray-400">Fotografia</span>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">
          <button 
            onClick={() => setPortalMode('casamento')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase transition ${portalMode === 'casamento' ? 'bg-[#c5a059] text-black' : 'text-gray-400'}`}>
            💍 Casamentos & 15 Anos
          </button>
          <button 
            onClick={() => setPortalMode('infantil')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase transition ${portalMode === 'infantil' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
            ☀️ Festas Infantis
          </button>
        </div>

        <button 
          onClick={() => setShowClientModal(true)}
          className="px-4 py-2 rounded-full border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition text-xs font-semibold uppercase">
          Área do Cliente
        </button>
      </header>

      {/* PORTAL CASAMENTO */}
      {portalMode === 'casamento' && (
        <main className="pt-20">
          {/* HERO */}
          <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
            <img src={heroSlides[heroIndex]} alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-all duration-1000" />
            <div className="absolute inset-0 bg-black/60 z-10" />
            
            <div className="relative z-20 text-center px-4 max-w-3xl">
              <span className="text-[#c5a059] text-xs font-bold uppercase tracking-[0.3em]">Fotografia de Casamentos & 15 Anos</span>
              <h1 className="text-6xl sm:text-8xl font-serif font-normal text-white my-4">Iury Mello</h1>
              <p className="text-gray-300 text-lg mb-8">Eternize os seus melhores momentos com dedicação exclusiva e imagens atemporais.</p>
              
              <a href="#orcamento" className="inline-block px-8 py-4 rounded-full bg-[#c5a059] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#e4c988] transition">
                Simular Orçamento (2026/2027)
              </a>
            </div>
          </section>

          {/* SIMULADOR DE ORÇAMENTO */}
          <section id="orcamento" className="py-20 px-6 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[#c5a059] text-xs font-bold uppercase tracking-widest">Tabela Oficial 2026/2027</span>
              <h2 className="text-4xl font-serif text-white mt-2">Monte o Seu Orçamento Interativo</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Opções */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-2xl bg-[#15181e] border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">1. Tipo de Evento</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => { setEventType('casamento'); setCoveragePkg('cas_essencial'); }} className={`p-3 rounded-xl border text-center transition ${eventType === 'casamento' ? 'border-[#c5a059] bg-[#c5a059]/10 text-white' : 'border-white/10 text-gray-400'}`}>💍 Casamento</button>
                    <button onClick={() => { setEventType('15anos'); setCoveragePkg('deb_essencial'); }} className={`p-3 rounded-xl border text-center transition ${eventType === '15anos' ? 'border-[#c5a059] bg-[#c5a059]/10 text-white' : 'border-white/10 text-gray-400'}`}>👑 15 Anos</button>
                    <button onClick={() => { setEventType('ensaioExclusivo'); setCoveragePkg('ens_prewedding'); }} className={`p-3 rounded-xl border text-center transition ${eventType === 'ensaioExclusivo' ? 'border-[#c5a059] bg-[#c5a059]/10 text-white' : 'border-white/10 text-gray-400'}`}>📸 Ensaio Solo</button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#15181e] border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">2. Pacotes de Cobertura</h3>
                  <div className="space-y-3">
                    {Object.entries(packagePrices).filter(([key]) => key.startsWith(eventType === 'casamento' ? 'cas' : eventType === '15anos' ? 'deb' : 'ens')).map(([key, item]) => (
                      <div key={key} onClick={() => setCoveragePkg(key)} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition ${coveragePkg === key ? 'border-[#c5a059] bg-[#c5a059]/10 text-white' : 'border-white/10 text-gray-400'}`}>
                        <span>{item.name}</span>
                        <span className="font-bold text-[#c5a059]">R$ {item.price.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#1c212a] border border-[#c5a059]/30 h-fit space-y-4">
                <h3 className="text-xl font-serif text-white font-bold">Resumo da Proposta</h3>
                <div className="text-sm text-gray-300 space-y-2 border-b border-white/10 pb-4">
                  <div className="flex justify-between"><span>{packagePrices[coveragePkg]?.name}</span><span className="text-[#c5a059]">R$ {basePrice}</span></div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total:</span>
                    <span className="text-[#c5a059]">R$ {totalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">À vista via PIX (5% desc.): R$ {pixPrice.toLocaleString('pt-BR')}</div>
                </div>

                <input type="text" placeholder="Seu Nome Completo" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-[#c5a059]" />
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-[#c5a059]" />

                <button onClick={handleSendWhatsApp} className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs tracking-wider transition">
                  Enviar Proposta via WhatsApp
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* PORTAL INFANTIL */}
      {portalMode === 'infantil' && (
        <main className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase">Festas Infantis</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-2">Fotografia de Aniversário Infantil</h2>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 space-y-6">
            <h3 className="font-bold text-slate-800">1. Duração do Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setKidsPkg('pocket')} className={`p-4 rounded-2xl border-2 text-left transition ${kidsPkg === 'pocket' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                <div className="font-bold text-slate-900">Festa Pocket (3h)</div>
                <div className="text-orange-600 font-bold mt-1">R$ 800</div>
              </button>
              <button onClick={() => setKidsPkg('completa')} className={`p-4 rounded-2xl border-2 text-left transition ${kidsPkg === 'completa' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                <div className="font-bold text-slate-900">Festa Completa (4h)</div>
                <div className="text-orange-600 font-bold mt-1">R$ 1.000</div>
              </button>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500">Valor Total:</span>
                <div className="text-3xl font-bold text-orange-600">R$ {kidsTotal}</div>
                <div className="text-xs text-emerald-600">À vista no PIX: R$ {kidsPix}</div>
              </div>

              <a href={`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(`Olá Iury! Gostaria de reservar a data para festa infantil (${kidsPkg === 'pocket' ? '3h' : '4h'}). Total: R$ ${kidsTotal}`)}`} target="_blank" className="px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition">
                Consultar Data no WhatsApp
              </a>
            </div>
          </div>
        </main>
      )}

      {/* MODAL ÁREA DO CLIENTE */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c212a] border border-[#c5a059]/40 p-8 rounded-2xl max-w-md w-full relative text-center">
            <button onClick={() => setShowClientModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-2xl font-serif text-white mb-2">Área do Cliente</h3>
            <p className="text-xs text-gray-400 mb-6">Digite seu código de acesso enviado pelo Iury:</p>

            <input 
              type="text" 
              placeholder="Ex: CASAMENTO-BEATRIZ" 
              value={clientCode} 
              onChange={(e) => setClientCode(e.target.value.toUpperCase())} 
              className="w-full text-center p-3 rounded-xl bg-black/50 border border-[#c5a059]/40 text-[#c5a059] font-mono font-bold mb-4 focus:outline-none" 
            />

            <button 
              onClick={() => {
                if (clientCode === 'CASAMENTO-BEATRIZ') {
                  setIsClientLoggedIn(true);
                } else {
                  alert('Código de teste: CASAMENTO-BEATRIZ');
                }
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