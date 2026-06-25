/* Reescreve os links de WhatsApp de suporte das páginas estáticas com o
   número atual (editável no admin). Busca /api/support-phone e troca o
   número padrão pelos links. Falha em silêncio — mantém o padrão. */
(function () {
  var DEFAULT = '5553997065725';
  try {
    fetch('/api/support-phone')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var num = j && j.phone;
        if (!num || num === DEFAULT) return;
        var links = document.querySelectorAll('a[href*="wa.me/' + DEFAULT + '"]');
        for (var i = 0; i < links.length; i++) {
          links[i].href = links[i].href.split(DEFAULT).join(num);
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
