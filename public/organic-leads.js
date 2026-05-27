(function () {
  var SUPABASE_URL = 'https://vmejwxfvgufwcztcjjmy.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_4mL_ZQ2Lhoo8EqJONThvSw_SrUXHJkJ';

  function clean(value) {
    return (value || '').toString().trim();
  }

  function utmParams() {
    var params = new URLSearchParams(window.location.search);
    var data = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      if (params.get(key)) data[key] = params.get(key);
    });
    return data;
  }

  async function saveLead(payload) {
    var response = await fetch(SUPABASE_URL + '/rest/v1/diagnostico_leads', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('lead_insert_failed_' + response.status);
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('a, button');
    if (!target || typeof gtag !== 'function') return;
    var label = target.textContent.trim();
    if (target.closest('[data-lead-form]')) return;
    if (target.href && target.href.indexOf('/cadastro') !== -1) {
      gtag('event', 'organic_trial_click', { event_label: label, page_path: window.location.pathname });
    }
  });

  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var error = form.querySelector('[data-lead-error]');
      var formState = form.closest('[data-form-state]');
      var card = form.closest('.lead-form-card');
      var successState = card && card.querySelector('[data-success-state]');
      var nome = clean(form.elements.nome && form.elements.nome.value);
      var whatsapp = clean(form.elements.whatsapp && form.elements.whatsapp.value);
      var email = clean(form.elements.email && form.elements.email.value);
      var oficina = clean(form.elements.oficina && form.elements.oficina.value);
      if (!nome || !whatsapp || !email) {
        if (error) {
          error.textContent = 'Preencha nome, WhatsApp e e-mail para liberar o material.';
          error.hidden = false;
        }
        return;
      }
      var oldText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Enviando...';
      }
      if (error) error.hidden = true;
      var origin = form.dataset.origin || window.location.pathname.replace(/^\//, '') || 'organico';
      var material = form.dataset.material || document.title.replace(' | BoxCerto', '');
      var payload = {
        nome: nome,
        email: email,
        origem: origin,
        respostas: {
          tipo: form.dataset.kind || 'organic',
          material: material,
          whatsapp: whatsapp,
          email: email,
          oficina: oficina,
          pagina: document.title,
          path: window.location.pathname,
          url: window.location.href,
          utm: utmParams()
        }
      };
      try {
        await saveLead(payload);
        localStorage.setItem('boxcerto_last_organic_lead', JSON.stringify({ origem: origin, material: material, criadoEm: new Date().toISOString() }));
        if (typeof gtag === 'function') {
          gtag('event', 'organic_lead_submit', { event_label: origin, page_path: window.location.pathname });
        }
        if (formState) formState.hidden = true;
        if (successState) successState.hidden = false;
      } catch (err) {
        if (error) {
          error.textContent = 'Não consegui enviar agora. Tente novamente em alguns segundos.';
          error.hidden = false;
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = oldText;
        }
      }
    });
  });
})();