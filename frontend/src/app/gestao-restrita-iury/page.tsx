'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Contract {
  id: string;
  contractCode: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  totalAmount: number;
  status: string;
}

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
  const [activeTab, setActiveTab] = useState<'contracts' | 'categories' | 'banners' | 'services'>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
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

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin-token') : null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeader();

    try {
      const [cRes, catRes, bRes, sRes] = await Promise.all([
        fetch('http://localhost:3333/api/admin/contracts', { headers }),
        fetch('http://localhost:3333/api/categories'),
        fetch('http://localhost:3333/api/banners'),
        fetch('http://localhost:3333/api/admin/services', { headers }),
      ]);

      if (cRes.status === 401 || sRes.status === 401) {
        localStorage.removeItem('admin-token');
        router.push('/login');
        return;
      }

      if (cRes.ok) setContracts(await cRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (bRes.ok) setBanners(await bRes.json());
      if (sRes.ok) setServices(await sRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    if (!token) {
      router.push('/login');
    } else {
      fetchData();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
    router.push('/login');
  };

  // Handlers Categorias
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    await fetch('http://localhost:3333/api/admin/categories', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ name: newCatName, imageUrl: newCatImage || null }),
    });
    setNewCatName('');
    setNewCatImage('');
    fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria/evento?')) return;
    await fetch(`http://localhost:3333/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    fetchData();
  };

  // Handlers Banners
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerImage) return;
    await fetch('http://localhost:3333/api/admin/banners', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ imageUrl: newBannerImage, title: newBannerTitle }),
    });
    setNewBannerImage('');
    setNewBannerTitle('');
    fetchData();
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Excluir esta imagem do carrossel?')) return;
    await fetch(`http://localhost:3333/api/admin/banners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    fetchData();
  };

  // Handlers Serviços
  const handleOpenNewService = () => {
    setEditingServiceId(null);
    setServiceForm({
      title: '',
      description: '',
      price: '',
      category: categories[0]?.name || 'Casamento',
      step: '1',
      imageUrl: '',
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setServiceForm({
      title: s.title,
      description: s.description || '',
      price: s.price.toString(),
      category: s.category,
      step: (s.step || 1).toString(),
      imageUrl: s.imageUrl || '',
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingServiceId
      ? `http://localhost:3333/api/admin/services/${editingServiceId}`
      : 'http://localhost:3333/api/admin/services';
    const method = editingServiceId ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: getAuthHeader(),
      body: JSON.stringify({
        title: serviceForm.title,
        description: serviceForm.description || null,
        price: parseFloat(serviceForm.price),
        category: serviceForm.category || (categories[0]?.name || 'Casamento'),
        step: parseInt(serviceForm.step),
        imageUrl: serviceForm.imageUrl || null,
      }),
    });
    setIsServiceModalOpen(false);
    fetchData();
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    await fetch(`http://localhost:3333/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    fetchData();
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    await fetch(`http://localhost:3333/api/admin/contracts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    fetchData();
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-amber-400">Painel do Fotógrafo</h1>
            <p className="text-sm text-gray-400">Gestão Protegida de Eventos, Banners, Catálogo e Contratos</p>
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
            onClick={() => setActiveTab('contracts')}
            className={`pb-2 text-sm font-bold border-b-2 ${
              activeTab === 'contracts' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400'
            }`}
          >
            📜 Contratos ({contracts.length})
          </button>
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
          <p className="text-center text-gray-400">A validar permissões e carregar dados...</p>
        ) : (
          <>
            {/* ABA 1: CONTRATOS */}
            {activeTab === 'contracts' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                {contracts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum contrato recebido até o momento.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 text-amber-400 text-xs font-bold uppercase border-b border-gray-800">
                        <th className="p-4">Código</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Data do Evento</th>
                        <th className="p-4">Valor Total</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-800/50">
                          <td className="p-4 font-mono text-amber-400 font-bold">{c.contractCode}</td>
                          <td className="p-4 text-white font-semibold">
                            <div>{c.clientName}</div>
                            <div className="text-xs text-gray-500">{c.clientPhone}</div>
                          </td>
                          <td className="p-4 text-gray-300">{new Date(c.eventDate).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 font-black text-amber-400">R$ {Number(c.totalAmount).toFixed(2)}</td>
                          <td className="p-4 text-right space-x-2">
                            <a
                              href={`http://localhost:3333/api/contracts/${c.id}/print`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded inline-block"
                            >
                              🖨️ Ver / PDF
                            </a>
                            <button
                              onClick={() => handleDeleteContract(c.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded hover:bg-red-500/30"
                            >
                              🗑️ Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ABA 2: EVENTOS / CATEGORIAS */}
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
                      placeholder="Ex: /casamento.jpg ou URL"
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

            {/* ABA 3: BANNERS / CARROSSEL */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
                <form onSubmit={handleAddBanner} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">URL / Caminho da Imagem *</label>
                    <input
                      required
                      type="text"
                      value={newBannerImage}
                      onChange={(e) => setNewBannerImage(e.target.value)}
                      placeholder="Ex: /making-of.jpg ou URL completa"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-400 mb-1">Legenda (Opcional)</label>
                    <input
                      type="text"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="Ex: Ensaio noivo e noiva"
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
                      <img src={b.imageUrl} alt="Banner" className="h-32 w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = '/logo.jpg')} />
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-xs text-gray-300 truncate max-w-[120px]">{b.title || 'Foto'}</span>
                        <button onClick={() => handleDeleteBanner(b.id)} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA 4: SERVIÇOS & PREÇOS */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">Cadastre e edite pacotes associados aos seus eventos.</p>
                  <button
                    onClick={handleOpenNewService}
                    className="px-4 py-2 bg-amber-400 text-gray-950 font-black rounded-xl text-xs"
                  >
                    + Novo Pacote / Serviço
                  </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 text-amber-400 text-xs font-bold uppercase border-b border-gray-800">
                        <th className="p-4">Título do Serviço</th>
                        <th className="p-4">Evento / Categoria</th>
                        <th className="p-4">Etapa / Passo</th>
                        <th className="p-4">Preço (R$)</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                      {services.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-800/50">
                          <td className="p-4 font-semibold text-white">
                            <div>{s.title}</div>
                            {s.description && <div className="text-xs text-gray-500 line-clamp-1">{s.description}</div>}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-gray-800 text-amber-400 rounded text-xs font-bold">{s.category}</span>
                          </td>
                          <td className="p-4 text-gray-300">
                            <span className="px-2 py-0.5 bg-gray-950 border border-gray-800 rounded text-xs font-mono">
                              Passo {s.step || 1}
                            </span>
                          </td>
                          <td className="p-4 font-black text-amber-400">R$ {Number(s.price).toFixed(2)}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditService(s)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded hover:bg-red-500/30"
                            >
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

      {/* MODAL NOVO / EDITAR SERVIÇO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h2 className="text-xl font-bold text-amber-400">
                {editingServiceId ? 'Editar Pacote/Serviço' : 'Adicionar Novo Pacote/Serviço'}
              </h2>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Título do Serviço *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Cobertura da Cerimônia"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-1">Evento / Categoria *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Entregas">Entregas Universais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-amber-400 mb-1 font-bold">Etapa / Passo *</label>
                  <select
                    value={serviceForm.step}
                    onChange={(e) => setServiceForm({ ...serviceForm, step: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-amber-400 font-bold text-sm"
                  >
                    <option value="1">Passo 1 (Base)</option>
                    <option value="2">Passo 2 (Ensaios)</option>
                    <option value="3">Passo 3 (Extras)</option>
                    <option value="4">Passo 4 (Entregas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Preço (R$) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Foto de Capa (Caminho ou URL)</label>
                <input
                  type="text"
                  placeholder="Ex: /casamento.jpg ou https://..."
                  value={serviceForm.imageUrl}
                  onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Descrição (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Descrição breve do serviço..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-amber-400 text-gray-950 font-black rounded-xl text-sm mt-2">
                {editingServiceId ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}