'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import ServiceCard from '@/components/ServiceCard';
import { useTheme } from '@/context/ThemeContext';

interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  step?: number;
  imageUrl?: string | null;
}

interface BudgetResponse {
  itemCount: number;
  items: ServiceItem[];
  totalAmount: number;
}

interface ContractSuccessData {
  contractId: string;
  contractCode: string;
  totalAmount: number;
  pixCopyPaste: string;
  pixQrCodeImage: string;
}

export default function TotemBudgetApp() {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentStepNumber, setCurrentStepNumber] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<ContractSuccessData | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientCpf: '',
    clientEmail: '',
    clientPhone: '',
    clientInstagram: '',
    eventDate: '',
    eventLocation: '',
    acceptedTerms: false,
  });

  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'Passo 1: Tipo de Cobertura Principal', subtitle: 'Selecione a cobertura principal para o evento' },
    2: { title: 'Passo 2: Ensaios e Preparativos', subtitle: 'Adicione sessões e ensaios fotográficos' },
    3: { title: 'Passo 3: Equipe Extra e Mídia', subtitle: 'Adicione fotógrafos extras e conteúdo vertical' },
    4: { title: 'Passo 4: Formato de Entrega e Álbuns', subtitle: 'Escolha como deseja receber suas memórias' },
  };

  useEffect(() => {
    async function initData() {
      try {
        const [catRes, banRes, servRes] = await Promise.all([
          fetch('http://localhost:3333/api/categories'),
          fetch('http://localhost:3333/api/banners'),
          fetch('http://localhost:3333/api/services'),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (banRes.ok) setBanners(await banRes.json());
        if (servRes.ok) setServices(await servRes.json());
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  useEffect(() => {
    async function recalculateBudget() {
      if (selectedIds.length === 0) {
        setBudget(null);
        return;
      }

      setCalculating(true);
      try {
        const response = await fetch('http://localhost:3333/api/budget/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedServiceIds: selectedIds }),
        });
        setBudget(await response.json());
      } catch (error) {
        console.error(error);
      } finally {
        setCalculating(false);
      }
    }

    recalculateBudget();
  }, [selectedIds]);

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert('Aceite os termos do contrato.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3333/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectedServiceIds: selectedIds,
        }),
      });

      const result = await response.json();
      setPaymentData({
        contractId: result.contractId,
        contractCode: result.contractCode,
        totalAmount: result.totalAmount,
        pixCopyPaste: result.pixCopyPaste,
        pixQrCodeImage: result.pixQrCodeImage,
      });
      setIsModalOpen(false);
    } catch (error) {
      alert('Erro ao conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepServices = services.filter((s) => {
    if (!selectedCategory) return false;
    const belongsToCategory = s.category === selectedCategory || s.category === 'Entregas';
    const matchesStep = (s.step || 1) === currentStepNumber;
    return belongsToCategory && matchesStep;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-xl text-amber-500">
        A carregar sistema...
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 transition-colors">
      <Header />

      {!selectedCategory ? (
        <div className="max-w-4xl mx-auto space-y-8">
          <Carousel banners={banners} />

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-amber-500">Qual é o seu evento?</h2>
            <p className="text-gray-400 text-sm">Selecione um evento abaixo para iniciar o seu orçamento.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setCurrentStepNumber(1);
                }}
                className={`group cursor-pointer relative h-48 rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-xl ${
                  theme === 'dark' ? 'border-gray-800 hover:border-amber-400' : 'border-gray-200 hover:border-amber-500'
                }`}
              >
                <img
                  src={cat.imageUrl || '/eventos.jpg'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => ((e.target as HTMLImageElement).src = '/logo.jpg')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent flex items-end p-6">
                  <div className="flex justify-between items-center w-full">
                    <h3 className="text-2xl font-black text-white group-hover:text-amber-400">{cat.name}</h3>
                    <span className="px-3 py-1 bg-amber-400 text-gray-950 rounded-lg text-xs font-bold">Iniciar →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4 ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-amber-500">{selectedCategory}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-400 font-semibold">Etapa {currentStepNumber} de 4</span>
              </div>
              <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stepTitles[currentStepNumber]?.title}
              </h2>
              <p className="text-xs text-gray-400">{stepTitles[currentStepNumber]?.subtitle}</p>
            </div>

            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← Trocar Evento
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {currentStepServices.length === 0 ? (
                <div className={`p-8 rounded-2xl text-center border ${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <p className="text-gray-400 text-sm">Nenhum serviço cadastrado para esta etapa no painel admin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentStepServices.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      isSelected={selectedIds.includes(s.id)}
                      onToggle={toggleService}
                    />
                  ))}
                </div>
              )}

              <div className={`flex justify-between items-center pt-4 border-t ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <button
                  disabled={currentStepNumber === 1}
                  onClick={() => setCurrentStepNumber((prev) => prev - 1)}
                  className={`px-5 py-2.5 disabled:opacity-30 font-bold rounded-xl text-xs border ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ← Passo Anterior
                </button>

                {currentStepNumber < 4 ? (
                  <button
                    onClick={() => setCurrentStepNumber((prev) => prev + 1)}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black rounded-xl text-xs shadow-lg"
                  >
                    Próxima Etapa →
                  </button>
                ) : (
                  <span className="text-xs text-amber-500 font-bold">✓ Todas as etapas concluídas</span>
                )}
              </div>
            </div>

            {/* RESUMO DO ORÇAMENTO */}
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-2xl sticky top-8 border shadow-xl ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-lg font-bold mb-4 border-b pb-2 ${
                  theme === 'dark' ? 'text-white border-gray-800' : 'text-gray-900 border-gray-100'
                }`}>
                  Resumo do Orçamento
                </h2>

                {selectedIds.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">Selecione opções ao lado para calcular.</p>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {budget?.items.map((item) => (
                        <li key={item.id} className={`flex justify-between text-xs py-1 border-b ${
                          theme === 'dark' ? 'border-gray-800/50' : 'border-gray-100'
                        }`}>
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{item.title}</span>
                          <span className="font-semibold text-amber-500">R$ {item.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={`border-t pt-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Total Garantido:</span>
                        <span className="text-2xl font-black text-amber-500">
                          {calculating ? 'Calculando...' : `R$ ${budget?.totalAmount.toFixed(2)}`}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black rounded-xl mt-4 text-sm shadow-lg transition-all"
                      >
                        Avançar para Dados do Contrato →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl p-6 my-8 space-y-4 border ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${
              theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <h2 className="text-xl font-bold text-amber-500">Dados do Contratante & Termos</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required type="text" placeholder="Nome Completo *" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <input required type="text" placeholder="CPF *" value={formData.clientCpf} onChange={(e) => setFormData({ ...formData, clientCpf: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <input required type="email" placeholder="E-mail *" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <input required type="text" placeholder="WhatsApp *" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <input type="text" placeholder="Instagram (@seuinstagram)" value={formData.clientInstagram} onChange={(e) => setFormData({ ...formData, clientInstagram: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <input required type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
              </div>
              <input required type="text" placeholder="Local do Evento *" value={formData.eventLocation} onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })} className={`w-full border rounded p-3 text-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />

              <div>
                <label className="block text-xs font-bold uppercase text-amber-500 mb-1">Termos e Condições do Contrato</label>
                <div className={`border rounded-lg p-3 text-xs max-h-36 overflow-y-auto space-y-2 leading-relaxed ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <p><strong>Cláusula 1ª - Entrega:</strong> O CONTRATADO apresentará via internet o material fotográfico tratado no prazo de até 15 dias úteis após o evento.</p>
                  <p><strong>Cláusula 2ª - Equipamentos:</strong> Danos materiais aos equipamentos por parte dos convidados são de responsabilidade do CONTRATANTE.</p>
                  <p><strong>Cláusula 3ª - Uso de Imagem:</strong> Autorizada a divulgação nas redes sociais e portfólio do fotógrafo Iury Mello.</p>
                  <p><strong>Cláusula 4ª - Cancelamento:</strong> Multa compensatória de 30% em caso de rescisão unilateral.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input required type="checkbox" id="acceptedTerms" checked={formData.acceptedTerms} onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                <label htmlFor="acceptedTerms" className={`text-xs cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Li e concordo com as cláusulas do contrato acima.
                </label>
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black rounded-xl text-base mt-2 transition-all shadow-lg">
                {submitting ? 'A processar...' : 'Confirmar e Ir para Pagamento →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PIX */}
      {paymentData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl p-6 text-center space-y-4 border ${
            theme === 'dark' ? 'bg-gray-900 border-amber-400/30' : 'bg-white border-amber-500/30'
          }`}>
            <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Contrato Gerado com Sucesso!
            </h2>
            <p className="text-xs text-gray-400">Código: <span className="text-amber-500 font-bold">{paymentData.contractCode}</span></p>
            <img src={paymentData.pixQrCodeImage} alt="PIX" className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-md" />
            <p className="text-2xl font-black text-amber-500">R$ {paymentData.totalAmount.toFixed(2)}</p>
            <a
              href={`http://localhost:3333/api/contracts/${paymentData.contractId}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl border border-gray-700 text-xs shadow transition-all"
            >
              🖨️ Visualizar / Imprimir Contrato (PDF)
            </a>
            <button onClick={() => setPaymentData(null)} className="w-full py-2 text-xs text-gray-400 hover:text-gray-200">Fechar</button>
          </div>
        </div>
      )}
    </main>
  );
}