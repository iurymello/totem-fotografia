'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3333/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin-token', data.token);
        localStorage.setItem('admin-user', JSON.stringify(data.user));
        router.push('/gestao-restrita-iury');
      } else {
        alert(data.error || 'Credenciais inválidas.');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-amber-400/20 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.jpg" alt="Logo" className="h-16 mx-auto rounded-lg object-contain" />
          <h1 className="text-2xl font-black text-white">Área Restrita</h1>
          <p className="text-xs text-gray-400">Insira suas credenciais para gerenciar o sistema.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">E-mail</label>
            <input
              required
              type="email"
              placeholder="iurymellofotografia@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3.5 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">Palavra-passe</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3.5 pr-10 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm p-1"
                title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black rounded-xl text-base shadow-lg transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'A validar...' : 'Entrar no Painel →'}
          </button>
        </form>
      </div>
    </main>
  );
}