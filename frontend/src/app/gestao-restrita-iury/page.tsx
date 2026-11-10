'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

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
  active: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'categories' | 'banners' | 'services'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');

  // Service Modal Form
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    step: '1',
    imageUrl: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const savedCats = localStorage.getItem('totem_categories');
      const savedBanners = localStorage.getItem('totem_banners');
      const savedServices = localStorage.getItem('totem_services');
      const token = localStorage.getItem('admin-token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Não foi possível carregar os eventos salvos. Entre novamente no painel.');
        setCategories(await response.json());
      } else {
        setCategories(savedCats ? JSON.parse(savedCats) : []);
      }

      setBanners(savedBanners ? JSON.parse(savedBanners) : []);
      setServices(savedServices ? JSON.parse(savedServices) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    router.push('/login');
  };

  // Handlers Categorias / Eventos
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const token = localStorage.getItem('admin-token');
    if (!token) {
      alert('Sua sessão expirou. Entre novamente no painel.');
      router.push('/login');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCatName.trim(), imageUrl: newCatImage.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível cadastrar o evento.');
      setCategories((current) => [...current, data]);
      setNewCatName('');
      setNewCatImage('');
      alert('Evento cadastrado com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao conectar com o servidor.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir este evento/categoria?')) return;
    const token = localStorage.getItem('admin-token');
    if (!token) return router.push('/login');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Não foi possível excluir o evento.');
      setCategories((current) => current.filter((category) => category.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao conectar com o servidor.');
    }
  };

  // Handlers Banners
  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerImage.trim()) return;

    const newB: Banner = {
      id: Date.now().toString(),
      title: newBannerTitle.trim() || null,
      imageUrl: newBannerImage.trim(),
    };

    const updated = [...banners, newB];
    setBanners(updated);
    localStorage.setItem('totem_banners', JSON.stringify(updated));

    setNewBannerImage('');
    setNewBannerTitle('');
  };

  const handleDeleteBanner = (id: string) => {
    if (!confirm('Excluir esta foto?')) return;
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    localStorage.setItem('totem_banners', JSON.stringify(updated));
  };

  // Handlers Serviços
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();

    let updated: ServiceItem[];
    if (editingServiceId) {
      updated = services.map((s) =>
        s.id === editingServiceId
          ? {
              ...s,
              title: serviceForm.title,
              description: serviceForm.description || null,
              price: parseFloat(serviceForm.price) || 0,
              category: serviceForm.category,
              step: parseInt(serviceForm.step),
              imageUrl: serviceForm.imageUrl || null,
            }
          : s
      );
    } else {
      const newS: ServiceItem = {
        id: Date.now().toString(),
        title: serviceForm.title,
        description: serviceForm.description || null,
        price: parseFloat(serviceForm.price) || 0,
        category: serviceForm.category || categories[0]?.name || 'Casamento',
        step: parseInt(serviceForm.step),
        imageUrl: serviceForm.imageUrl || null,
        active: true,
      };
      updated = [...services, newS];
    }

    setServices(updated);
    localStorage.setItem('totem_services', JSON.stringify(updated));
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    localStorage.setItem('totem_services', JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-amber-400">Painel do Fotógrafo</h1>
            <p className="text-sm text-gray-400">Gestão Protegida de Eventos, Banners e Catálogo (Modo Cloud Online)</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-lg">
              ← Ir para o Totem
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold rounded-lg border border-red-500/30 transition-all"
            >
              🚪 Sair
            </button>
          </div>
        </header>

        {/* NAVEGAÇÃO ABAS */}
        <div className="flex gap-4 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2 text-sm font-bold border-b-2 ${
              activeTab === 'categories' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400'
            }`}
          >
            🎉 Eventos / Categorias ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`pb-2 text-sm font-bold border-b-2 ${
              activeTab === 'banners' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400'
            }`}
          >
            🖼️ Carrossel de Fotos ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-2 text-sm font-bold border-b-2 ${
              activeTab === 'services' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400'
            }`}
          >
            ⚙️ Serviços & Preços ({services.length})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">A carregar dados do painel...</p>
        ) : (
          <>
            {/* EVENTOS / CATEGORIAS */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <form onSubmit={handleAddCategory} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">Nome do Evento</label>
                    <input
                      required
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ex: Formatura"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">Imagem de Capa (Opcional)</label>
                    <input
                      type="text"
                      value={newCatImage}
                      onChange={(e) => setNewCatImage(e.target.value)}
                      placeholder="Ex: https://..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="px-6 py-3 bg-amber-400 text-gray-950 font-black rounded-xl hover:bg-amber-300">
                    + Cadastrar Evento
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{cat.imageUrl || 'Sem imagem'}</p>
                      </div>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30">
                        🗑️ Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BANNERS */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
                <form onSubmit={handleAddBanner} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">URL da Imagem *</label>
                    <input
                      required
                      type="text"
                      value={newBannerImage}
                      onChange={(e) => setNewBannerImage(e.target.value)}
                      placeholder="Ex: https://..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="px-6 py-3 bg-amber-400 text-gray-950 font-black rounded-xl hover:bg-amber-300">
                    + Adicionar Foto
                  </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {banners.map((b) => (
                    <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                      <img src={b.imageUrl} alt="Banner" className="h-32 w-full object-cover" />
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-xs text-gray-300 truncate">{b.title || 'Foto'}</span>
                        <button onClick={() => handleDeleteBanner(b.id)} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SERVIÇOS & PREÇOS */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">Cadastre e edite pacotes associados aos seus eventos.</p>
                  <button
                    onClick={() => {
                      setEditingServiceId(null);
                      setServiceForm({ title: '', description: '', price: '', category: categories[0]?.name || 'Casamento', step: '1', imageUrl: '' });
                      setIsServiceModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-400 text-gray-950 font-black rounded-xl text-xs"
                  >
                    + Novo Pacote
                  </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 text-amber-400 text-xs font-bold uppercase border-b border-gray-800">
                        <th className="p-4">Título do Serviço</th>
                        <th className="p-4">Evento</th>
                        <th className="p-4">Preço (R$)</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                      {services.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-800/50">
                          <td className="p-4 font-semibold text-white">{s.title}</td>
                          <td className="p-4"><span className="px-2 py-1 bg-gray-800 text-amber-400 rounded text-xs font-bold">{s.category}</span></td>
                          <td className="p-4 font-black text-amber-400">R$ {Number(s.price).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteService(s.id)} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded hover:bg-red-500/30">
                              🗑️ Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
