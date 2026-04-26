-- ============================================================
-- BoxCerto — Admin V2 Migration
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Snapshots diários de MRR (histórico para gráficos)
CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data        date NOT NULL DEFAULT CURRENT_DATE,
  mrr         numeric(10,2) NOT NULL DEFAULT 0,
  arr         numeric(10,2) NOT NULL DEFAULT 0,
  active_count   integer NOT NULL DEFAULT 0,
  trial_count    integer NOT NULL DEFAULT 0,
  new_count      integer NOT NULL DEFAULT 0,   -- novos assinantes no dia
  churned_count  integer NOT NULL DEFAULT 0,   -- cancelamentos no dia
  created_at  timestamptz DEFAULT now(),
  UNIQUE (data)
);

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lê snapshots" ON mrr_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin insere snapshots" ON mrr_snapshots FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Popula snapshots com dados dos últimos 6 meses baseado em profiles atuais
-- (estimativa retroativa — será atualizado diariamente pelo cron)
INSERT INTO mrr_snapshots (data, mrr, arr, active_count, trial_count)
SELECT
  generate_series::date,
  0, 0, 0, 0
FROM generate_series(
  (CURRENT_DATE - INTERVAL '6 months'),
  CURRENT_DATE,
  '1 day'::interval
) AS generate_series
ON CONFLICT (data) DO NOTHING;

-- ============================================================
-- 2. Templates de email editáveis
CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,  -- 'welcome', 'trial_ending', 'reativacao', 'novidade', 'promocao'
  nome        text NOT NULL,
  assunto     text NOT NULL,
  corpo_html  text NOT NULL,
  variaveis   text[] DEFAULT '{}',   -- lista de variáveis: ['{{nome}}', '{{oficina}}', '{{dias}}']
  ativo       boolean DEFAULT true,
  atualizado_em timestamptz DEFAULT now(),
  atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia templates" ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Insere templates padrão
INSERT INTO email_templates (slug, nome, assunto, corpo_html, variaveis) VALUES
(
  'welcome',
  'Boas-vindas',
  'Bem-vindo ao BoxCerto, {{nome}}! 🚀',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:#4f46e5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">Bem-vindo ao BoxCerto!</h1>
  </div>
  <p style="font-size:16px;color:#1e293b">Olá, <strong>{{nome}}</strong>!</p>
  <p style="color:#475569">A <strong>{{oficina}}</strong> agora tem acesso completo ao BoxCerto por <strong>{{trialDias}} dias grátis</strong>.</p>
  <p style="color:#475569">Com o BoxCerto você pode:</p>
  <ul style="color:#475569;line-height:2">
    <li>📋 Gerenciar ordens de serviço</li>
    <li>💰 Controlar financeiro e recibos</li>
    <li>📦 Controlar estoque de peças</li>
    <li>📊 Ver relatórios de desempenho</li>
  </ul>
  <div style="text-align:center;margin:32px 0">
    <a href="https://www.boxcerto.com/app/oficina" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
      Acessar o BoxCerto →
    </a>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center">Dúvidas? Fale com a gente pelo WhatsApp.</p>
</div>',
  ARRAY['{{nome}}', '{{oficina}}', '{{trialDias}}']
),
(
  'trial_ending',
  'Trial expirando',
  '⏰ Seu período gratuito termina em {{dias}} dias — renove agora',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:#f59e0b;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:22px">⏰ Seu trial está acabando</h1>
  </div>
  <p style="font-size:16px;color:#1e293b">Olá, <strong>{{nome}}</strong>!</p>
  <p style="color:#475569">Seu período gratuito na <strong>{{oficina}}</strong> termina em <strong>{{dias}} dias</strong>.</p>
  <p style="color:#475569">Para continuar usando o BoxCerto sem interrupção, assine agora.</p>
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0">
    <p style="color:#92400e;font-weight:600;margin:0">📌 Plano Mensal: R$47,90/mês</p>
    <p style="color:#92400e;font-weight:600;margin:4px 0">🏆 Plano Anual: R$418,80/ano (equivale a R$34,90/mês)</p>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="https://www.boxcerto.com/assinar" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
      Assinar agora →
    </a>
  </div>
</div>',
  ARRAY['{{nome}}', '{{oficina}}', '{{dias}}']
),
(
  'reativacao',
  'Reativação',
  '{{nome}}, sentimos sua falta! Volte ao BoxCerto 👋',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <p style="font-size:16px;color:#1e293b">Olá, <strong>{{nome}}</strong>!</p>
  <p style="color:#475569">Percebemos que a <strong>{{oficina}}</strong> não acessa o BoxCerto há algum tempo.</p>
  <p style="color:#475569">Gostaríamos de entender se tudo está bem ou se podemos ajudar em algo.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="https://www.boxcerto.com/app/oficina" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">
      Acessar o BoxCerto →
    </a>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center">Precisa de ajuda? Responda este e-mail ou fale pelo WhatsApp.</p>
</div>',
  ARRAY['{{nome}}', '{{oficina}}']
),
(
  'novidade',
  'Novidade / Update',
  '🚀 Novidade no BoxCerto: {{titulo}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:#4f46e5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:22px">🚀 {{titulo}}</h1>
  </div>
  <p style="font-size:16px;color:#1e293b">Olá, <strong>{{nome}}</strong>!</p>
  <p style="color:#475569">{{mensagem}}</p>
  <div style="text-align:center;margin:28px 0">
    <a href="https://www.boxcerto.com/app/oficina" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">
      Ver agora →
    </a>
  </div>
</div>',
  ARRAY['{{nome}}', '{{titulo}}', '{{mensagem}}']
),
(
  'promocao',
  'Promoção',
  '🎉 Oferta especial para {{oficina}} — válida por tempo limitado',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:22px">🎉 Oferta Especial!</h1>
  </div>
  <p style="font-size:16px;color:#1e293b">Olá, <strong>{{nome}}</strong>!</p>
  <p style="color:#475569">Temos uma oferta exclusiva para a <strong>{{oficina}}</strong>:</p>
  <div style="background:#f5f3ff;border:2px solid #818cf8;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
    <p style="font-size:24px;font-weight:800;color:#4f46e5;margin:0">{{oferta}}</p>
    <p style="color:#6366f1;margin:8px 0 0">Válido até {{validade}}</p>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="https://www.boxcerto.com/assinar" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">
      Aproveitar oferta →
    </a>
  </div>
</div>',
  ARRAY['{{nome}}', '{{oficina}}', '{{oferta}}', '{{validade}}']
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Coluna last_seen_at já existe (criada na migration anterior)
-- Aqui criamos a função + trigger para atualizar automaticamente no login

CREATE OR REPLACE FUNCTION update_last_seen_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_seen_at = now() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dispara quando um usuário faz login (atualiza last_sign_in_at)
-- Como não temos acesso direto ao auth.users via trigger simples,
-- atualizamos via RPC chamada no frontend (AuthContext)
-- A função abaixo é chamada pelo app após login:

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET last_seen_at = now() WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

-- ============================================================
-- 4. Audit log para ações sensíveis do admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action          text NOT NULL,  -- 'impersonate', 'delete_user', 'toggle_admin', etc.
  target_user_id  uuid,
  target_email    text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lê audit log" ON admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Service role insere audit log" ON admin_audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. Coluna notas_internas em profiles (notas do admin sobre o cliente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notas_admin text;

-- ============================================================
-- PRONTO! Execute tudo acima de uma vez no SQL Editor.
-- ============================================================
