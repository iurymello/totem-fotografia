import 'dotenv/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import QRCode from 'qrcode';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres.');

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3333,https://totem-fotografia.vercel.app,https://iurymello.com.br,https://www.iurymello.com.br').split(',').map((origin) => origin.trim()).filter(Boolean);
const app = Fastify({ logger: true, bodyLimit: 64 * 1024, trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false });
const prisma = new PrismaClient();
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]!));
const hashGalleryToken = (token: string) => createHash('sha256').update(token).digest('hex');
const galleryTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const secureUrlSchema = z.string().url().max(2048).refine((value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } }, 'Use um endereço HTTPS.');
const nullableImageUrl = z.union([secureUrlSchema, z.null()]).optional();
const categorySchema = z.object({ name: z.string().trim().min(2).max(80), imageUrl: nullableImageUrl }).strict();
const bannerSchema = z.object({ title: z.string().trim().max(120).nullable().optional(), imageUrl: secureUrlSchema, order: z.number().int().min(0).max(1000).optional() }).strict();
const serviceSchema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).nullable().optional(), price: z.number().finite().min(0).max(999999.99), category: z.string().trim().min(2).max(80), step: z.number().int().min(1).max(10).optional(), imageUrl: nullableImageUrl }).strict();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const loginRateLimit = async (request: any, reply: any) => {
  const now = Date.now();
  const key = request.ip as string;
  if (loginAttempts.size > 1000) {
    for (const [ip, attempt] of loginAttempts) if (attempt.resetAt <= now) loginAttempts.delete(ip);
  }
  const state = loginAttempts.get(key);
  if (!state || state.resetAt <= now) { loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 }); return; }
  state.count += 1;
  if (state.count > 5) return reply.header('Retry-After', Math.ceil((state.resetAt - now) / 1000)).code(429).send({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
};
const loginSchema = z.object({ email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()), password: z.string().min(1).max(200) });
const contractPrintToken = (id: string) => createHmac('sha256', jwtSecret).update('contract-print:' + id).digest('hex');

app.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (request.url.startsWith('/api/admin/')) reply.header('Cache-Control', 'private, no-store');
  return payload;
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof z.ZodError) return reply.code(400).send({ error: 'Revise os dados enviados.' });
  if ((error as any).code === 'P2025') return reply.code(404).send({ error: 'Registro não encontrado.' });
  if ((error as any).code === 'P2002') return reply.code(409).send({ error: 'Este registro já existe.' });
  request.log.error(error);
  return reply.code(500).send({ error: 'Erro interno do servidor.' });
});

// Registar CORS
app.register(cors, {
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Registar JWT
app.register(fastifyJwt, {
  secret: jwtSecret,
});

// Middleware de Autenticação para Rotas Admin
app.decorate('authenticate', async (request: any, reply: any) => {
  const cookieHeader = String(request.headers.cookie || '');
  const token = cookieHeader.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('admin_session='))?.slice('admin_session='.length);
  if (!token) return reply.status(401).send({ error: 'Acesso não autorizado. Faça login novamente.' });
  try {
    await app.jwt.verify(token);
  } catch {
    return reply.status(401).send({ error: 'Acesso não autorizado. Faça login novamente.' });
  }
});

// Rota de Login do Administrador
app.post('/api/admin/login', { preHandler: loginRateLimit }, async (request, reply) => {
  try {
    const { email, password } = loginSchema.parse(request.body);
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }

    const token = app.jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      { expiresIn: '8h' }
    );
    loginAttempts.delete(request.ip);
    const secureCookie = process.env.COOKIE_SECURE === 'false' ? '' : '; Secure';
    reply.header('Set-Cookie', `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secureCookie}`);
    return reply.send({ user: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Informe e-mail e senha válidos.' });
    request.log.error(error);
    return reply.status(500).send({ error: 'Erro ao processar login.' });
  }
});

// Links de galeria: token aleatório de 256 bits, armazenado somente como hash.
const galleryCreateSchema = z.object({
  label: z.string().trim().min(2).max(100),
  driveUrl: z.string().url().max(2048).refine((value) => {
    try { const url = new URL(value); return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(url.hostname); } catch { return false; }
  }, 'Use um link HTTPS do Google Drive.'),
  expiresAt: z.string().datetime().optional().nullable(),
}).strict().refine((data) => !data.expiresAt || new Date(data.expiresAt) > new Date(), { path: ['expiresAt'], message: 'A expiração precisa ser futura.' });

app.post('/api/admin/galleries', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const data = galleryCreateSchema.parse(request.body);
  const token = randomBytes(32).toString('base64url');
  const gallery = await prisma.clientGalleryLink.create({
    data: { label: data.label, driveUrl: data.driveUrl, tokenHash: hashGalleryToken(token), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
    select: { id: true, label: true, expiresAt: true, revokedAt: true, createdAt: true },
  });
  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://www.iurymello.com.br').replace(/\/$/, '');
  return reply.code(201).send({ ...gallery, url: siteUrl + '/f/' + token });
});

app.get('/api/admin/galleries', { onRequest: [(app as any).authenticate] }, async (_request, reply) => {
  const galleries = await prisma.clientGalleryLink.findMany({
    select: { id: true, label: true, expiresAt: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' }, take: 100,
  });
  return reply.send(galleries);
});

app.delete('/api/admin/galleries/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!z.string().uuid().safeParse(id).success) return reply.code(400).send({ error: 'Identificador inválido.' });
  await prisma.clientGalleryLink.update({ where: { id }, data: { revokedAt: new Date() } });
  return reply.code(204).send();
});

app.get('/api/galleries/:token', async (request, reply) => {
  const { token } = request.params as { token: string };
  if (!galleryTokenPattern.test(token)) return reply.code(404).send({ error: 'Link indisponível.' });
  const gallery = await prisma.clientGalleryLink.findUnique({ where: { tokenHash: hashGalleryToken(token) } });
  if (!gallery || gallery.revokedAt || (gallery.expiresAt && gallery.expiresAt <= new Date())) {
    return reply.header('Cache-Control', 'no-store').header('X-Robots-Tag', 'noindex, nofollow, noarchive').code(404).send({ error: 'Link indisponível.' });
  }
  return reply.header('Cache-Control', 'private, no-store').header('X-Robots-Tag', 'noindex, nofollow, noarchive').redirect(gallery.driveUrl, 302);
});

app.post('/api/admin/logout', async (_request, reply) => {
  const secureCookie = process.env.COOKIE_SECURE === 'false' ? '' : '; Secure';
  return reply.header('Set-Cookie', `admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie}`).code(204).send();
});

// ==================== ROTAS PÚBLICAS (TOTEM) ====================
app.get('/api/banners', async (request, reply) => {
  const banners = await prisma.bannerImage.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
  return reply.send(banners);
});

app.get('/api/categories', async (request, reply) => {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  return reply.send(categories);
});

app.get('/api/services', async (request, reply) => {
  const services = await prisma.serviceItem.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });
  return reply.send(services);
});

app.post('/api/budget/calculate', async (request, reply) => {
  const { selectedServiceIds } = request.body as { selectedServiceIds: string[] };
  const dbServices = await prisma.serviceItem.findMany({
    where: { id: { in: selectedServiceIds }, active: true },
  });

  if (dbServices.length === 0) return reply.status(400).send({ error: 'Nenhum serviço válido' });

  const totalAmount = dbServices.reduce((sum, item) => sum + Number(item.price), 0);

  return reply.send({
    itemCount: dbServices.length,
    items: dbServices.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      price: Number(item.price),
    })),
    totalAmount: Number(totalAmount.toFixed(2)),
  });
});

const createContractSchema = z.object({
  clientName: z.string().trim().min(3).max(120),
  clientCpf: z.string().max(20).transform((val) => val.replace(/\D/g, '')).refine((val) => val.length === 11),
  clientEmail: z.string().trim().email().max(254),
  clientPhone: z.string().max(30).transform((val) => val.replace(/\D/g, '')).refine((val) => val.length >= 10),
  clientInstagram: z.string().trim().max(80).optional(),
  eventDate: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value)), 'Data inválida.'),
  eventLocation: z.string().trim().min(3).max(240),
  selectedServiceIds: z.array(z.string().uuid()).min(1).max(20).refine((ids) => new Set(ids).size === ids.length),
  acceptedTerms: z.boolean().refine((val) => val === true),
});

app.post('/api/contracts', async (request, reply) => {
  try {
    const data = createContractSchema.parse(request.body);
    const dbServices = await prisma.serviceItem.findMany({
      where: { id: { in: data.selectedServiceIds }, active: true },
    });

    if (dbServices.length === 0) return reply.status(400).send({ error: 'Nenhum serviço válido' });

    const totalAmount = dbServices.reduce((sum, item) => sum + Number(item.price), 0);
    const clientIp = request.ip;
    const contractCode = `CTR-${randomBytes(4).toString('hex').toUpperCase()}`;

    const pixPayload = `00020126580014BR.GOV.BCB.PIX0136iurymellofotografia@gmail.com520400005303986540${totalAmount.toFixed(2).length}${totalAmount.toFixed(2)}5802BR5915IURY MELLO FOTO6009NITEROI62070503***6304ABCD`;
    const pixQrCodeDataUrl = await QRCode.toDataURL(pixPayload);

    const contractText = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS
Contratante: ${data.clientName} (CPF: ${data.clientCpf})
Instagram: ${data.clientInstagram || 'Não informado'}
Evento: ${new Date(data.eventDate).toLocaleDateString('pt-BR')} em ${data.eventLocation}
Valor Total: R$ ${totalAmount.toFixed(2)}`;

    const newContract = await prisma.contract.create({
      data: {
        contractCode,
        clientName: data.clientName,
        clientCpf: data.clientCpf,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientInstagram: data.clientInstagram || null,
        eventDate: new Date(data.eventDate),
        eventLocation: data.eventLocation,
        totalAmount,
        status: 'PENDING_PAYMENT',
        acceptedAt: new Date(),
        acceptedIp: clientIp,
        contractText,
        pixQrCode: pixPayload,
        items: {
          create: dbServices.map((service) => ({
            serviceId: service.id,
            priceAtSale: service.price,
            quantity: 1,
          })),
        },
      },
    });

    const printToken = contractPrintToken(newContract.id);

    return reply.status(201).send({
      message: 'Contrato gerado com sucesso!',
      contractId: newContract.id,
      printToken,
      contractCode: newContract.contractCode,
      totalAmount: Number(newContract.totalAmount),
      pixCopyPaste: pixPayload,
      pixQrCodeImage: pixQrCodeDataUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Revise os dados informados.' });
    request.log.error(error);
    return reply.status(500).send({ error: 'Erro ao gerar contrato' });
  }
});

app.get('/api/contracts/:id/print', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const suppliedToken = String((request.query as { token?: string }).token || '');
    const expectedToken = contractPrintToken(id);
    if (!/^[a-f0-9]{64}$/.test(suppliedToken) || suppliedToken.length !== expectedToken.length || !timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(expectedToken))) {
      return reply.status(404).send({ error: 'Contrato não encontrado.' });
    }
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { items: { include: { service: true } } },
    });

    if (!contract) return reply.status(404).send({ error: 'Contrato não encontrado' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Contrato - ${escapeHtml(contract.contractCode)}</title>
        <style>
          * { box-sizing: border-box; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
          body { padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; background: #fff; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
          .subbrand { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: #666; margin-top: 4px; }
          .doc-title { font-size: 14px; font-weight: bold; background: #f0f0f0; display: inline-block; padding: 4px 12px; border-radius: 4px; margin-top: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .box { background: #fafafa; border: 1px solid #eee; padding: 15px; border-radius: 8px; font-size: 13px; }
          .box-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          .services-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          .services-table th { background: #1a1a1a; color: #fff; text-align: left; padding: 8px; text-transform: uppercase; font-size: 11px; }
          .services-table td { padding: 8px; border-bottom: 1px solid #eee; }
          .total-row { font-size: 16px; font-weight: bold; text-align: right; padding-top: 10px; }
          .clause { font-size: 11px; color: #444; margin-bottom: 10px; text-align: justify; }
          .clause-title { font-weight: bold; color: #1a1a1a; }
          .audit-box { background: #f4f8f5; border: 1px solid #c8e6c9; padding: 12px; border-radius: 6px; font-size: 11px; color: #2e7d32; margin-top: 20px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
        <div class="header">
          <h1 class="brand">IURY MELLO</h1>
          <div class="subbrand">F O T O G R A F I A</div>
          <div class="doc-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS • ${escapeHtml(contract.contractCode)}</div>
        </div>
        <div class="grid">
          <div class="box">
            <div class="box-title">Contratante</div>
            <strong>Nome:</strong> ${escapeHtml(contract.clientName)}<br>
            <strong>CPF:</strong> ${escapeHtml(contract.clientCpf)}<br>
            <strong>E-mail:</strong> ${escapeHtml(contract.clientEmail)}<br>
            <strong>Telefone/WA:</strong> ${escapeHtml(contract.clientPhone)}<br>
            <strong>Instagram/Social:</strong> ${escapeHtml(contract.clientInstagram || 'Não informado')}
          </div>
          <div class="box">
            <div class="box-title">Contratado</div>
            <strong>Nome:</strong> Iury Moreira de Mello<br>
            <strong>CPF:</strong> 129.824.017-46<br>
            <strong>E-mail:</strong> iurymellofotografia@gmail.com<br>
            <strong>Telefone:</strong> (21) 99927-6478
          </div>
        </div>
        <div class="box" style="margin-bottom: 20px;">
          <div class="box-title">Detalhes do Evento</div>
          <strong>Data do Evento:</strong> ${escapeHtml(new Date(contract.eventDate).toLocaleDateString('pt-BR'))}<br>
          <strong>Local:</strong> ${escapeHtml(contract.eventLocation)}
        </div>
        <div class="box" style="margin-bottom: 20px;">
          <div class="box-title">Serviços Selecionados</div>
          <table class="services-table">
            <thead>
              <tr>
                <th>Descrição do Serviço / Pacote</th>
                <th style="text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${contract.items.map((item) => `
                <tr>
                  <td>${escapeHtml(item.service.title)}</td>
                  <td style="text-align: right;">R$ ${Number(item.priceAtSale).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row">VALOR TOTAL: R$ ${Number(contract.totalAmount).toFixed(2)}</div>
        </div>
        <div style="margin-top: 25px;">
          <div class="box-title">Cláusulas e Condições</div>
          <div class="clause"><span class="clause-title">Cláusula 1ª - Entrega:</span> O CONTRATADO apresentará via internet o material fotográfico tratado no prazo de até 15 dias úteis após a realização do evento.</div>
          <div class="clause"><span class="clause-title">Cláusula 2ª - Responsabilidade:</span> Danos materiais causados aos equipamentos por convidados ou terceiros são de responsabilidade do CONTRATANTE.</div>
          <div class="clause"><span class="clause-title">Cláusula 3ª - Uso de Imagem:</span> O CONTRATANTE autoriza a veiculação das fotografias nas redes sociais e portfólio do fotógrafo Iury Mello.</div>
          <div class="clause"><span class="clause-title">Cláusula 4ª - Cancelamento:</span> Multa compensatória de 30% em favor da parte prejudicada.</div>
        </div>
        <div class="audit-box">
          ✔ <strong>Aceite Digital Registrado em:</strong> ${escapeHtml(new Date(contract.acceptedAt!).toLocaleString('pt-BR'))}<br>
          🌐 <strong>Endereço IP de Assinatura:</strong> <code>${escapeHtml(contract.acceptedIp)}</code><br>
          💳 <strong>Status do Pagamento:</strong> ${contract.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
        </div>
      </body>
      </html>
    `;

    return reply.type('text/html').header('Cache-Control', 'private, no-store').header('X-Robots-Tag', 'noindex, nofollow, noarchive').header('X-Frame-Options', 'DENY').header('X-Content-Type-Options', 'nosniff').header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'").send(htmlContent);
  } catch (error) {
    return reply.status(500).send({ error: 'Erro ao gerar PDF' });
  }
});

// ==================== ROTAS PROTEGIDAS (REQUEREM LOGIN JWT) ====================
app.post('/api/admin/banners', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const body = bannerSchema.parse(request.body);
  const banner = await prisma.bannerImage.create({
    data: {
      title: body.title || null,
      imageUrl: body.imageUrl,
      order: body.order ?? 0,
      active: true,
    },
  });
  return reply.status(201).send(banner);
});

app.delete('/api/admin/banners/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await prisma.bannerImage.delete({ where: { id } });
  return reply.send({ message: 'Banner excluído com sucesso!' });
});

app.post('/api/admin/categories', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const body = categorySchema.parse(request.body);
  const category = await prisma.category.create({
    data: {
      name: body.name,
      imageUrl: body.imageUrl || null,
      active: true,
    },
  });
  return reply.status(201).send(category);
});

app.get('/api/admin/categories', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return reply.send(categories);
});

app.delete('/api/admin/categories/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await prisma.category.delete({ where: { id } });
  return reply.send({ message: 'Categoria excluída com sucesso!' });
});

app.get('/api/admin/services', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const services = await prisma.serviceItem.findMany({ orderBy: { createdAt: 'desc' } });
  return reply.send(services);
});

app.post('/api/admin/services', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const body = serviceSchema.parse(request.body);
  const newService = await prisma.serviceItem.create({
    data: {
      title: body.title,
      description: body.description || null,
      price: body.price,
      category: body.category,
      step: body.step ?? 1,
      imageUrl: body.imageUrl || null,
      active: true,
    },
  });
  return reply.status(201).send(newService);
});

app.put('/api/admin/services/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = serviceSchema.parse(request.body);
  const updatedService = await prisma.serviceItem.update({
    where: { id },
    data: {
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      price: Number(body.price),
      category: String(body.category),
      step: body.step ? Number(body.step) : 1,
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
    },
  });
  return reply.send(updatedService);
});

app.delete('/api/admin/services/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    await prisma.serviceItem.delete({ where: { id } });
    return reply.send({ message: 'Serviço excluído com sucesso!' });
  } catch (error) {
    await prisma.serviceItem.update({
      where: { id },
      data: { active: false },
    });
    return reply.send({ message: 'Serviço desativado por conter histórico.' });
  }
});

app.get('/api/admin/contracts', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const contracts = await prisma.contract.findMany({ orderBy: { createdAt: 'desc' } });
  return reply.send(contracts);
});

app.delete('/api/admin/contracts/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await prisma.contractItem.deleteMany({ where: { contractId: id } });
  await prisma.contract.delete({ where: { id } });
  return reply.send({ message: 'Contrato excluído com sucesso!' });
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3333, host: '0.0.0.0' });
    console.log('🚀 Servidor seguro rodando em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
