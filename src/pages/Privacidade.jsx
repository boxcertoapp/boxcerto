import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

const EMPRESA  = 'BoxCerto Tecnologia Ltda.'
const CNPJ     = '52.354.481/0001-37'
const EMAIL    = 'contato@boxcerto.com'
const WHATSAPP = '(53) 99706-5725'
const DATA_VIG = '01 de maio de 2025'

function Secao({ num, titulo, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{num}. {titulo}</h2>
      <div className="text-slate-600 leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-xl">BoxCerto</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Política de Privacidade</h1>
        <p className="text-xs text-slate-400 mb-8">Vigência a partir de {DATA_VIG} · Em conformidade com a LGPD (Lei nº 13.709/2018)</p>

        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          A <strong>{EMPRESA}</strong>, CNPJ {CNPJ}, operadora da plataforma BoxCerto ("nós", "nosso"), está
          comprometida com a proteção da privacidade dos seus usuários ("você", "titular"). Esta Política descreve
          como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de
          Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <Secao num={1} titulo="Dados que Coletamos">
          <p><strong>Dados fornecidos diretamente por você:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Nome completo e nome da oficina;</li>
            <li>Endereço de e-mail;</li>
            <li>Número de WhatsApp;</li>
            <li>Senha (armazenada de forma criptografada — nunca em texto puro);</li>
            <li>Dados inseridos na plataforma: informações de clientes, veículos, orçamentos, serviços e estoque.</li>
          </ul>
          <p className="mt-2"><strong>Dados coletados automaticamente:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Endereço IP e dados de navegação (para segurança e diagnóstico);</li>
            <li>Data, hora e frequência de acesso;</li>
            <li>Tipo de dispositivo e navegador;</li>
            <li>Logs de erro para fins de manutenção.</li>
          </ul>
          <p className="mt-2"><strong>Dados de pagamento:</strong> processados diretamente pela <strong>Stripe</strong>.
          O BoxCerto não armazena números de cartão de crédito. Recebemos apenas tokens de identificação do cliente
          no sistema da Stripe (stripe_customer_id) necessários para gestão da assinatura.</p>
        </Secao>

        <Secao num={2} titulo="Finalidade do Tratamento">
          <p>Tratamos seus dados para as seguintes finalidades:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Prestação do serviço:</strong> criar e manter sua conta, processar e exibir orçamentos, enviar links de aprovação aos seus clientes;</li>
            <li><strong>Comunicação:</strong> enviar notificações sobre sua conta (confirmação de cadastro, encerramento de trial, falhas de pagamento);</li>
            <li><strong>Suporte:</strong> responder dúvidas e resolver problemas técnicos;</li>
            <li><strong>Segurança:</strong> detectar e prevenir fraudes, acessos não autorizados e abusos;</li>
            <li><strong>Obrigações legais:</strong> cumprir determinações legais ou regulatórias aplicáveis.</li>
          </ul>
        </Secao>

        <Secao num={3} titulo="Bases Legais (LGPD)">
          <p>O tratamento dos seus dados é realizado com fundamento nas seguintes bases legais previstas na LGPD:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Execução de contrato</strong> (art. 7º, V): para prestação do serviço contratado;</li>
            <li><strong>Consentimento</strong> (art. 7º, I): para comunicações de marketing, quando aplicável;</li>
            <li><strong>Legítimo interesse</strong> (art. 7º, IX): para segurança, prevenção de fraudes e melhoria do serviço;</li>
            <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II): quando exigido por lei ou autoridade competente.</li>
          </ul>
        </Secao>

        <Secao num={4} titulo="Compartilhamento de Dados">
          <p>
            O BoxCerto <strong>não vende</strong> dados pessoais a terceiros. Compartilhamos dados apenas nas
            seguintes situações:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Provedores de serviço:</strong> Supabase (armazenamento e autenticação), Stripe (processamento
              de pagamentos) e Resend (envio de e-mails transacionais) — todos sujeitos a contratos de
              confidencialidade e políticas de privacidade próprias;
            </li>
            <li>
              <strong>Autoridades legais:</strong> quando exigido por ordem judicial, regulatória ou legal;
            </li>
            <li>
              <strong>Transferência de negócio:</strong> em caso de fusão, aquisição ou venda da empresa, com
              notificação prévia ao titular.
            </li>
          </ul>
        </Secao>

        <Secao num={5} titulo="Dados dos Clientes da sua Oficina">
          <p>
            Ao cadastrar dados de seus clientes na plataforma (nome, telefone, veículo etc.), você, como usuário do
            BoxCerto, assume a qualidade de <strong>controlador de dados</strong> perante seus clientes. O BoxCerto
            atua como <strong>operador</strong>, processando esses dados exclusivamente conforme suas instruções e
            para a finalidade de prestação do serviço.
          </p>
          <p>
            É sua responsabilidade garantir que seus clientes estejam cientes do tratamento de seus dados, conforme
            a LGPD. O BoxCerto não utiliza os dados dos clientes da sua oficina para nenhuma finalidade própria.
          </p>
        </Secao>

        <Secao num={6} titulo="Retenção de Dados">
          <p>Mantemos seus dados pelo tempo necessário para:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Prestar o serviço contratado enquanto sua conta estiver ativa;</li>
            <li>Cumprir obrigações legais (prazo mínimo de 5 anos para registros financeiros, conforme legislação fiscal);</li>
            <li>Exercer direitos em eventuais processos judiciais ou administrativos.</li>
          </ul>
          <p>
            Após o encerramento da conta, os dados são mantidos por até <strong>30 (trinta) dias</strong> para
            possibilitar reativação. Após esse prazo, são anonimizados ou excluídos, salvo obrigação legal.
          </p>
        </Secao>

        <Secao num={7} titulo="Seus Direitos como Titular (LGPD)">
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Acesso:</strong> confirmar a existência de tratamento e acessar seus dados;</li>
            <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
            <li><strong>Exclusão:</strong> solicitar a eliminação dos dados tratados com base em consentimento;</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável;</li>
            <li><strong>Oposição:</strong> opor-se ao tratamento realizado com base em legítimo interesse;</li>
            <li><strong>Revogação do consentimento:</strong> retirar o consentimento a qualquer momento, sem prejuízo das operações anteriores.</li>
          </ul>
          <p>
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
            <strong>{EMAIL}</strong>. Responderemos em até <strong>15 (quinze) dias úteis</strong>.
          </p>
        </Secao>

        <Secao num={8} titulo="Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não
            autorizado, perda acidental, destruição ou divulgação indevida. Entre as medidas aplicadas:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Criptografia de senhas (bcrypt via Supabase Auth);</li>
            <li>Comunicação via HTTPS com certificados TLS;</li>
            <li>Autenticação por token JWT com expiração;</li>
            <li>Políticas de acesso restrito a dados por usuário (Row Level Security);</li>
            <li>Infraestrutura em nuvem com backups automáticos.</li>
          </ul>
          <p>
            Em caso de incidente de segurança que possa afetar seus dados, notificaremos a Autoridade Nacional de
            Proteção de Dados (ANPD) e os titulares afetados dentro dos prazos legais.
          </p>
        </Secao>

        <Secao num={9} titulo="Cookies e Tecnologias Semelhantes">
          <p>
            O BoxCerto utiliza cookies técnicos essenciais para o funcionamento da plataforma (autenticação e sessão).
            Não utilizamos cookies de rastreamento de terceiros para fins publicitários.
          </p>
          <p>
            Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento da
            plataforma.
          </p>
        </Secao>

        <Secao num={10} titulo="Transferência Internacional de Dados">
          <p>
            Nossos provedores de infraestrutura (Supabase, Stripe, Vercel) operam parcialmente em servidores
            localizados fora do Brasil. Essas transferências ocorrem com salvaguardas adequadas, incluindo cláusulas
            contratuais padrão e adesão a regulamentos internacionais de proteção de dados (GDPR, SOC 2), conforme
            exigido pelo art. 33 da LGPD.
          </p>
        </Secao>

        <Secao num={11} titulo="Encarregado de Proteção de Dados (DPO)">
          <p>
            O Encarregado de Proteção de Dados do BoxCerto pode ser contatado pelo e-mail{' '}
            <a href={`mailto:${EMAIL}`} className="text-indigo-600 hover:underline">{EMAIL}</a>. Ele é responsável
            por responder às solicitações dos titulares e atuar como canal de comunicação com a ANPD.
          </p>
        </Secao>

        <Secao num={12} titulo="Alterações nesta Política">
          <p>
            Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas com{' '}
            <strong>30 (trinta) dias de antecedência</strong> por e-mail ou notificação na plataforma. A versão
            vigente estará sempre disponível em <strong>boxcerto.com/privacidade</strong>.
          </p>
        </Secao>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <p className="text-xs text-slate-400 text-center">
            Dúvidas sobre privacidade?{' '}
            <a href={`mailto:${EMAIL}`} className="text-indigo-600 hover:underline">{EMAIL}</a>
            {' '}·{' '}
            <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              WhatsApp {WHATSAPP}
            </a>
          </p>
          <p className="text-xs text-slate-400 text-center mt-2">
            <Link to="/termos" className="hover:underline">Ver também: Termos de Uso</Link>
            {' '}·{' '}
            <Link to="/" className="hover:underline">← Voltar para o BoxCerto</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
