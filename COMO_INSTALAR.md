# MecanicaCerto — Guia de Instalação

## ⚡ Início Rápido (3 comandos)

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## 🔐 Acesso Admin

- **E-mail:** rogerioknfilho@gmail.com
- **Senha:** Admin123!

---

## 🌐 Deploy no Vercel (RECOMENDADO)

1. Crie uma conta em https://vercel.com
2. Importe este projeto do GitHub (ou arraste a pasta)
3. Configure as variáveis de ambiente no painel Vercel:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SoqBmRzYtXgEJJx...
VITE_STRIPE_PRICE_MONTHLY=price_1TP5ZhRzYtXgEJJx6iMgObmd
VITE_STRIPE_PRICE_ANNUAL=price_1TP5ZhRzYtXgEJJxLzePVdrz
STRIPE_SECRET_KEY=sk_live_51SoqBmRzYtXgEJJx1pfyot...
STRIPE_WEBHOOK_SECRET=whsec_... (pegar no painel Stripe)
```

4. Deploy automático!

---

## 🔗 Configurar Webhook Stripe

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.vercel.app/api/stripe-webhook`
4. Eventos a escutar:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copie o "Signing secret" e coloque em `STRIPE_WEBHOOK_SECRET`

---

## 📁 Estrutura do Projeto

```
mecanicacerto/
├── api/
│   ├── create-checkout-session.js  ← Cria sessão Stripe
│   └── stripe-webhook.js           ← Recebe eventos Stripe
├── src/
│   ├── contexts/AuthContext.jsx    ← Autenticação
│   ├── lib/storage.js              ← Dados (pronto para Supabase)
│   ├── pages/
│   │   ├── Landing.jsx             ← Página inicial
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Pending.jsx
│   │   ├── app/
│   │   │   ├── AppLayout.jsx       ← Tab bar
│   │   │   ├── Oficina.jsx         ← Módulo 1
│   │   │   ├── Historico.jsx       ← Módulo 2
│   │   │   ├── Financeiro.jsx      ← Módulo 3
│   │   │   └── Menu.jsx            ← Módulo 4
│   │   └── admin/
│   │       └── AdminPanel.jsx      ← Painel admin
│   └── App.jsx                     ← Rotas
└── vercel.json                     ← Config deploy
```

---

## 🚀 Adicionar Supabase (próximo passo)

Quando quiser migrar de localStorage para banco de dados real:

1. Crie projeto em https://supabase.com
2. Adicione ao .env:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. A camada de dados em `src/lib/storage.js` foi projetada para
   migração fácil — todas as funções têm equivalente direto no Supabase.

---

## 📱 Testar como App no celular

1. Faça deploy no Vercel
2. Acesse o link no celular
3. Chrome: Menu → "Adicionar à tela inicial"
4. Safari: Compartilhar → "Adicionar à Tela de Início"
