import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import QRCode from 'qrcode';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Registar CORS
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Registar JWT
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'chave-secreta-super-protegida-iury-mello-2026',
});

// Middleware de Autenticação para Rotas Admin
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Acesso não autorizado. Faça login novamente.' });
  }
});

// Rota de Login do Administrador
app.post('/api/admin/login', async (request, reply) => {
  try {
    const { email, password } = request.body as any;

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }

    const token = app.jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      { expiresIn: '8h' }
    );

    return reply.send({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Erro ao processar login.' });
  }
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
  clientName: z.string().min(3),
  clientCpf: z.string().transform((val) => val.replace(/\D/g, '')).refine((val) => val.length === 11),
  clientEmail: z.string().email(),
  clientPhone: z.string().transform((val) => val.replace(/\D/g, '')).refine((val) => val.length >= 10),
  clientInstagram: z.string().optional(),
  eventDate: z.string(),
  eventLocation: z.string().min(3),
  selectedServiceIds: z.array(z.string()).min(1),
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
    const clientIp = (request.headers['x-forwarded-for'] as string) || request.ip;
    const contractCode = `CTR-${Date.now().toString().slice(-6)}`;

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

    return reply.status(201).send({
      message: 'Contrato gerado com sucesso!',
      contractId: newContract.id,
      contractCode: newContract.contractCode,
      totalAmount: Number(newContract.totalAmount),
      pixCopyPaste: pixPayload,
      pixQrCodeImage: pixQrCodeDataUrl,
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Erro ao gerar contrato' });
  }
});

app.get('/api/contracts/:id/print', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
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
        <title>Contrato - ${contract.contractCode}</title>
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
          <div class="doc-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS • ${contract.contractCode}</div>
        </div>
        <div class="grid">
          <div class="box">
            <div class="box-title">Contratante</div>
            <strong>Nome:</strong> ${contract.clientName}<br>
            <strong>CPF:</strong> ${contract.clientCpf}<br>
            <strong>E-mail:</strong> ${contract.clientEmail}<br>
            <strong>Telefone/WA:</strong> ${contract.clientPhone}<br>
            <strong>Instagram/Social:</strong> ${contract.clientInstagram || 'Não informado'}
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
          <strong>Data do Evento:</strong> ${new Date(contract.eventDate).toLocaleDateString('pt-BR')}<br>
          <strong>Local:</strong> ${contract.eventLocation}
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
                  <td>${item.service.title}</td>
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
          ✔ <strong>Aceite Digital Registrado em:</strong> ${new Date(contract.acceptedAt!).toLocaleString('pt-BR')}<br>
          🌐 <strong>Endereço IP de Assinatura:</strong> <code>${contract.acceptedIp}</code><br>
          💳 <strong>Status do Pagamento:</strong> ${contract.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
        </div>
      </body>
      </html>
    `;

    return reply.type('text/html').send(htmlContent);
  } catch (error) {
    return reply.status(500).send({ error: 'Erro ao gerar PDF' });
  }
});

// ==================== ROTAS PROTEGIDAS (REQUEREM LOGIN JWT) ====================
app.post('/api/admin/banners', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const body = request.body as any;
  const banner = await prisma.bannerImage.create({
    data: {
      title: body.title || null,
      imageUrl: String(body.imageUrl),
      order: body.order ? Number(body.order) : 0,
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
  const body = request.body as any;
  const category = await prisma.category.create({
    data: {
      name: String(body.name),
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      active: true,
    },
  });
  return reply.status(201).send(category);
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
  const body = request.body as any;
  const newService = await prisma.serviceItem.create({
    data: {
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      price: Number(body.price),
      category: String(body.category),
      step: body.step ? Number(body.step) : 1,
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      active: true,
    },
  });
  return reply.status(201).send(newService);
});

app.put('/api/admin/services/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = request.body as any;
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
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log('🚀 Servidor seguro rodando em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();