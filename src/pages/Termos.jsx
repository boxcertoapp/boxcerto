import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

const EMPRESA  = 'BoxCerto Tecnologia Ltda.'
const CNPJ     = '00.000.000/0001-00' // substituir pelo CNPJ real
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

export default function Termos() {
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
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Termos de Uso</h1>
        <p className="text-xs text-slate-400 mb-8">Vigência a partir de {DATA_VIG}</p>

        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          Estes Termos de Uso ("Termos") regulam o acesso e o uso da plataforma BoxCerto, disponível em{' '}
          <strong>boxcerto.com</strong>, operada por <strong>{EMPRESA}</strong>, CNPJ {CNPJ} ("BoxCerto", "nós" ou
          "nosso"). Ao criar uma conta, você ("Usuário" ou "Cliente") concorda integralmente com estes Termos. Se
          não concordar, não utilize o serviço.
        </p>

        <Secao num={1} titulo="Objeto">
          <p>
            O BoxCerto é um software de gestão online (SaaS) voltado para oficinas mecânicas, auto elétricas,
            funilarias, estofarias e estabelecimentos do setor automotivo. A plataforma oferece funcionalidades como
            cadastro de orçamentos, aprovação de serviços por link, controle de histórico de veículos, gestão
            financeira e controle de estoque.
          </p>
        </Secao>

        <Secao num={2} titulo="Conta e Cadastro">
          <p>
            Para usar o BoxCerto, o Usuário deve criar uma conta fornecendo informações verdadeiras, completas e
            atualizadas. O Usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as
            ações realizadas sob sua conta.
          </p>
          <p>
            O BoxCerto reserva-se o direito de recusar ou cancelar cadastros que violem estes Termos, contenham
            informações falsas ou que, a critério exclusivo do BoxCerto, representem risco ao serviço ou a terceiros.
          </p>
        </Secao>

        <Secao num={3} titulo="Período de Teste (Trial)">
          <p>
            Novos usuários têm acesso gratuito à plataforma por <strong>7 (sete) dias corridos</strong> a partir da
            data de ativação da conta, sem necessidade de cadastrar cartão de crédito.
          </p>
          <p>
            Ao término do período de teste, o acesso às funcionalidades fica suspenso até a contratação de um plano
            pago. Os dados da conta ficam preservados por até <strong>30 (trinta) dias</strong> após o encerramento
            do trial, prazo após o qual podem ser permanentemente excluídos.
          </p>
        </Secao>

        <Secao num={4} titulo="Planos e Pagamento">
          <p>
            O BoxCerto oferece planos de assinatura mensais e anuais cujos preços vigentes estão disponíveis em{' '}
            <Link to="/#precos" className="text-indigo-600 hover:underline">boxcerto.com/#precos</Link>. Os valores
            podem ser atualizados mediante aviso prévio de <strong>30 (trinta) dias</strong>.
          </p>
          <p>
            O pagamento é processado com segurança pela plataforma <strong>Stripe</strong>. Ao fornecer dados de
            pagamento, o Usuário autoriza a cobrança recorrente conforme o plano escolhido.
          </p>
          <p>
            Em caso de falha de pagamento, o BoxCerto enviará notificação ao e-mail cadastrado. Após <strong>5
            (cinco) dias</strong> sem regularização, o acesso poderá ser suspenso.
          </p>
        </Secao>

        <Secao num={5} titulo="Cancelamento e Reembolso">
          <p>
            O Usuário pode cancelar sua assinatura a qualquer momento acessando o portal de gerenciamento de
            assinaturas disponível na plataforma. O cancelamento encerra a renovação automática; o acesso permanece
            ativo até o fim do período já pago.
          </p>
          <p>
            <strong>Não há reembolso proporcional</strong> de períodos já faturados, exceto nos casos previstos no
            art. 49 do Código de Defesa do Consumidor (desistência em até 7 dias corridos da primeira contratação,
            realizada exclusivamente por meios digitais).
          </p>
          <p>
            Para solicitar reembolso dentro do prazo legal, entre em contato pelo e-mail <strong>{EMAIL}</strong> ou
            WhatsApp <strong>{WHATSAPP}</strong>.
          </p>
        </Secao>

        <Secao num={6} titulo="Uso Aceitável">
          <p>O Usuário compromete-se a utilizar o BoxCerto exclusivamente para fins lícitos e em conformidade com a
          legislação brasileira. É vedado:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
            <li>Usar a plataforma para armazenar ou transmitir conteúdo ilegal, difamatório ou ofensivo;</li>
            <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte da plataforma;</li>
            <li>Sobrecarregar intencionalmente os servidores ou prejudicar o funcionamento do serviço;</li>
            <li>Usar robôs, scrapers ou meios automatizados para acessar a plataforma sem autorização.</li>
          </ul>
        </Secao>

        <Secao num={7} titulo="Dados e Privacidade">
          <p>
            O tratamento de dados pessoais do Usuário é regido pela nossa{' '}
            <Link to="/privacidade" className="text-indigo-600 hover:underline">Política de Privacidade</Link>, em
            conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Ao usar o BoxCerto, o
            Usuário declara ter lido e concordado com a Política de Privacidade.
          </p>
          <p>
            Os dados inseridos na plataforma pelo Usuário (dados de clientes, veículos, orçamentos) pertencem ao
            próprio Usuário. O BoxCerto não os vende nem os compartilha com terceiros para fins comerciais.
          </p>
        </Secao>

        <Secao num={8} titulo="Disponibilidade e Suporte">
          <p>
            O BoxCerto empreende esforços razoáveis para manter a plataforma disponível 24 horas por dia, 7 dias por
            semana. Eventuais interrupções para manutenção serão comunicadas com antecedência sempre que possível.
          </p>
          <p>
            O BoxCerto não garante disponibilidade ininterrupta e não se responsabiliza por danos decorrentes de
            interrupções causadas por falhas de infraestrutura de terceiros (servidores, provedores de internet,
            etc.).
          </p>
          <p>
            Suporte técnico está disponível via WhatsApp <strong>{WHATSAPP}</strong> e e-mail{' '}
            <strong>{EMAIL}</strong> em horário comercial (segunda a sexta, 9h–18h).
          </p>
        </Secao>

        <Secao num={9} titulo="Limitação de Responsabilidade">
          <p>
            Na máxima extensão permitida pela lei, o BoxCerto não se responsabiliza por danos indiretos, incidentais,
            especiais ou consequentes, incluindo perda de receita, perda de dados ou interrupção de negócios,
            decorrentes do uso ou da impossibilidade de uso da plataforma.
          </p>
          <p>
            A responsabilidade total do BoxCerto perante o Usuário, por qualquer causa, fica limitada ao valor pago
            pelo Usuário nos últimos <strong>3 (três) meses</strong> anteriores ao evento gerador do dano.
          </p>
        </Secao>

        <Secao num={10} titulo="Propriedade Intelectual">
          <p>
            Toda a plataforma BoxCerto — incluindo código, design, marca, logotipo e conteúdo próprio — é protegida
            por direitos autorais e demais normas de propriedade intelectual aplicáveis. Nenhum direito de
            propriedade é transferido ao Usuário pelo uso da plataforma.
          </p>
        </Secao>

        <Secao num={11} titulo="Alterações nos Termos">
          <p>
            O BoxCerto pode revisar estes Termos a qualquer momento. Alterações relevantes serão comunicadas com{' '}
            <strong>30 (trinta) dias de antecedência</strong> por e-mail ou notificação na plataforma. O uso
            continuado após a vigência das alterações constitui aceite das novas condições.
          </p>
        </Secao>

        <Secao num={12} titulo="Rescisão">
          <p>
            O BoxCerto pode suspender ou encerrar a conta do Usuário, a qualquer momento, em caso de violação destes
            Termos, sem prejuízo de outras medidas cabíveis. O Usuário pode encerrar sua conta a qualquer momento
            pelo portal de cancelamento ou entrando em contato com o suporte.
          </p>
        </Secao>

        <Secao num={13} titulo="Foro e Lei Aplicável">
          <p>
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de{' '}
            <strong>Pelotas/RS</strong> para dirimir eventuais conflitos, com renúncia a qualquer outro, por mais
            privilegiado que seja.
          </p>
        </Secao>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <p className="text-xs text-slate-400 text-center">
            Dúvidas? Fale com a gente:{' '}
            <a href={`mailto:${EMAIL}`} className="text-indigo-600 hover:underline">{EMAIL}</a>
            {' '}·{' '}
            <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              WhatsApp {WHATSAPP}
            </a>
          </p>
          <p className="text-xs text-slate-400 text-center mt-2">
            <Link to="/" className="hover:underline">← Voltar para o BoxCerto</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
