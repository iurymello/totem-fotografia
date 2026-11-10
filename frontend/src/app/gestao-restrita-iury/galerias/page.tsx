'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = (process.env.NODE_ENV === 'development' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333') : '').replace(/\/$/, '');
type Gallery = { id: string; label: string; expiresAt: string | null; revokedAt: string | null; createdAt: string };

export default function ClientGalleriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Gallery[]>([]);
  const [label, setLabel] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [issuedUrl, setIssuedUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetch(API_BASE_URL + '/api/admin/galleries', { headers: { 'Content-Type': 'application/json' }, credentials: 'include', cache: 'no-store' });
    if (response.status === 401) { router.push('/login'); return; }
    if (!response.ok) throw new Error('Não foi possível carregar os links.');
    setItems(await response.json());
  }, [router]);

  useEffect(() => {
    load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Falha ao carregar.'));
  }, [load, router]);

  const createLink = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setIssuedUrl('');
    try {
      const response = await fetch(API_BASE_URL + '/api/admin/galleries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ label, driveUrl, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível criar o link.');
      setIssuedUrl(result.url); setLabel(''); setDriveUrl(''); setExpiresAt(''); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao criar link.'); }
    finally { setBusy(false); }
  };

  const revoke = async (item: Gallery) => {
    if (item.revokedAt || !confirm('Revogar o link de ' + item.label + '?')) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/admin/galleries/' + item.id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível revogar o link.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao revogar link.'); }
  };

  return <main className="min-h-screen bg-gray-950 text-gray-100 p-5 sm:p-10"><div className="max-w-4xl mx-auto space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-5"><div><h1 className="text-2xl font-black text-amber-400">Links de entrega</h1><p className="text-sm text-gray-400 mt-1">Cada link usa um código aleatório e pode ser revogado.</p></div><a href="/gestao-restrita-iury" className="rounded-lg bg-gray-800 px-4 py-2 text-sm">Voltar ao painel</a></header>
    <form onSubmit={createLink} className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
      <h2 className="font-bold">Criar link para uma galeria do Google Drive</h2>
      <label className="block text-sm">Identificação interna (não aparece no link)<input required maxLength={100} value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 p-3" placeholder="Ex.: João e Clara — casamento" /></label>
      <label className="block text-sm">Link de compartilhamento do Google Drive<input required type="url" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 p-3" placeholder="https://drive.google.com/..." /></label>
      <label className="block text-sm">Expiração (opcional)<input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 block rounded-lg border border-gray-700 bg-gray-950 p-3" /></label>
      <p className="text-xs text-gray-400">Quem tiver o link poderá acessar o Drive. O endereço usa um código não previsível; não coloque nomes ou datas nele.</p>
      <button disabled={busy} className="rounded-lg bg-amber-400 px-5 py-3 font-bold text-gray-950 disabled:opacity-50">{busy ? 'Criando…' : 'Criar link'}</button>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {issuedUrl && <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-4"><p className="mb-2 text-sm text-emerald-300">Link criado. Copie agora; por segurança ele não será mostrado novamente.</p><input readOnly value={issuedUrl} onFocus={(e) => e.currentTarget.select()} className="w-full rounded bg-gray-950 p-3 text-sm"/><button type="button" onClick={() => navigator.clipboard.writeText(issuedUrl)} className="mt-3 rounded bg-emerald-700 px-4 py-2 text-sm">Copiar</button></div>}
    </form>
    <section className="space-y-3"><h2 className="font-bold">Links cadastrados</h2>{items.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4"><div><p className="font-semibold">{item.label}</p><p className="text-xs text-gray-400">Criado em {new Date(item.createdAt).toLocaleString('pt-BR')}{item.expiresAt ? ' • expira em ' + new Date(item.expiresAt).toLocaleString('pt-BR') : ''}</p><p className={'mt-1 text-xs ' + (item.revokedAt ? 'text-rose-400' : 'text-emerald-400')}>{item.revokedAt ? 'Revogado' : item.expiresAt && new Date(item.expiresAt) <= new Date() ? 'Expirado' : 'Ativo'}</p></div><button disabled={Boolean(item.revokedAt)} onClick={() => revoke(item)} className="rounded-lg border border-rose-800 px-3 py-2 text-sm text-rose-300 disabled:opacity-40">Revogar</button></article>)}{items.length === 0 && <p className="text-sm text-gray-400">Nenhum link criado.</p>}</section>
  </div></main>;
}
