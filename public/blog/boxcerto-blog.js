(function () {
  var root = document.documentElement;
  var savedTheme = localStorage.getItem('boxcerto_blog_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;

  document.addEventListener('click', function (event) {
    var themeToggle = event.target.closest('[data-theme-toggle]');
    if (themeToggle) {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('boxcerto_blog_theme', next);
    }
    var menuToggle = event.target.closest('[data-menu-toggle]');
    if (menuToggle) {
      var menu = document.querySelector('[data-mobile-nav]');
      if (menu) menu.classList.toggle('is-open');
    }
    var share = event.target.closest('[data-share]');
    if (share) {
      var url = encodeURIComponent(location.href);
      var title = encodeURIComponent(document.title);
      var target = {
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
        x: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
        whatsapp: 'https://api.whatsapp.com/send?text=' + title + '%20' + url,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url
      }[share.dataset.share];
      if (target) window.open(target, '_blank', 'noopener,noreferrer');
    }
    var localLink = event.target.closest('a[href]');
    var isLocalDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (isLocalDev && localLink && !localLink.closest('[data-category]') && !localLink.target) {
      var href = localLink.getAttribute('href') || '';
      var localTarget = null;
      if (href === '/blog') localTarget = '/blog/index.html';
      else if (/^\/blog\/categoria\/[^/.]+$/.test(href)) localTarget = href + '.html';
      else if (/^\/blog\/[^/.#?]+$/.test(href)) localTarget = href + '.html';
      else if (/^\/(planilha-os-oficina-mecanica-gratis|modelo-orcamento-oficina-mecanica-gratis|calculadora-mao-de-obra-oficina-mecanica|planilha-fluxo-caixa-oficina-mecanica-gratis|planilha-estoque-pecas-oficina-gratis)$/.test(href)) localTarget = href + '.html';
      if (localTarget) {
        event.preventDefault();
        location.href = localTarget;
      }
    }
  });

  var activeCategory = document.body.dataset.activeCategory || 'todos';
  var query = '';
  var cards = Array.from(document.querySelectorAll('[data-post-card]'));
  var count = document.querySelector('[data-visible-count]');
  var empty = document.querySelector('[data-empty-state]');

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (card) {
      var matchesCategory = activeCategory === 'todos' || card.dataset.category === activeCategory;
      var haystack = card.dataset.title || '';
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      var show = matchesCategory && matchesQuery;
      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });
    if (count) count.textContent = String(visible).padStart(2, '0') + ' artigos';
    if (empty) empty.hidden = visible !== 0;
    document.querySelectorAll('[data-category]').forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.category === activeCategory);
    });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-category]');
    if (!link || !document.body.matches('[data-page="index"]')) return;
    event.preventDefault();
    activeCategory = link.dataset.category || 'todos';
    var url = activeCategory === 'todos' ? '/blog' : '/blog/categoria/' + activeCategory;
    history.pushState({ category: activeCategory }, '', url);
    applyFilters();
  });

  window.addEventListener('popstate', function () {
    var match = location.pathname.match(/\/blog\/categoria\/([^/]+)/);
    activeCategory = match ? match[1] : 'todos';
    applyFilters();
  });

  document.querySelectorAll('[data-blog-search]').forEach(function (input) {
    var form = input.closest('form');
    if (form) form.addEventListener('submit', function (event) { event.preventDefault(); });
    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase();
      applyFilters();
    });
  });
  applyFilters();

  var article = document.querySelector('[data-article]');
  var progress = document.querySelector('[data-reading-progress]');
  var tocLinks = Array.from(document.querySelectorAll('[data-toc-link]'));
  if (article && progress) {
    var updateProgress = function () {
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      progress.style.width = (scrolled / Math.max(total, 1) * 100) + '%';
      var active = tocLinks[0] && tocLinks[0].dataset.tocLink;
      tocLinks.forEach(function (link) {
        var node = document.getElementById(link.dataset.tocLink);
        if (node && node.getBoundingClientRect().top < 140) active = link.dataset.tocLink;
      });
      tocLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.dataset.tocLink === active);
      });
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  document.querySelectorAll('[data-newsletter-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        input && input.focus();
        return;
      }
      var email = input.value.trim();
      var button = form.querySelector('button');
      var oldText = button && button.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = 'Enviando...';
      }
      try {
        var response = await fetch('https://vmejwxfvgufwcztcjjmy.supabase.co/rest/v1/diagnostico_leads', {
          method: 'POST',
          headers: {
            apikey: 'sb_publishable_4mL_ZQ2Lhoo8EqJONThvSw_SrUXHJkJ',
            Authorization: 'Bearer sb_publishable_4mL_ZQ2Lhoo8EqJONThvSw_SrUXHJkJ',
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            nome: 'Newsletter Blog',
            email: email,
            origem: 'blog_newsletter',
            respostas: {
              tipo: 'newsletter',
              email: email,
              material: 'Newsletter do blog',
              pagina: document.title,
              path: window.location.pathname,
              url: window.location.href
            }
          })
        });
        if (!response.ok) {
          throw new Error('newsletter_lead_failed');
        }
        localStorage.setItem('boxcerto_blog_newsletter', email);
        if (button) button.textContent = '✓ Inscrito';
      } catch (error) {
        if (button) button.textContent = oldText || 'Inscrever';
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
})();