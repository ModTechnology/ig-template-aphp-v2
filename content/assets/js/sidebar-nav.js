/**
 * sidebar-nav.js
 * Ajustements DOM et fonctionnalités interactives pour le template AP-HP.
 * La navigation latérale est générée en Liquid (fragment-pagebegin.html).
 */
(function() {

  /* --- Page active + profondeur dynamique dans le sidebar --- */

  var sidebarList = document.getElementById('sidebar-list');
  if (sidebarList) {
    var items = sidebarList.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      var cls = items[i].className;
      var match = cls.match(/sidebar-depth-(\d+)/);
      if (match) {
        var depth = parseInt(match[1]);
        if (depth > 0) {
          var link = items[i].querySelector('a');
          if (link) {
            link.style.paddingLeft = (15 + depth * 14) + 'px';
            link.style.fontSize = depth === 1 ? '13px' : '12px';
            link.style.color = depth === 1 ? '#555' : '#777';
          }
        }
      }
    }

    // Trouver les groupes dont le parent est artifacts.html (trop de sous-pages)
    var artifactsGroups = {};
    var depth0Items = sidebarList.querySelectorAll('.sidebar-depth-0');
    for (var d = 0; d < depth0Items.length; d++) {
      var a = depth0Items[d].querySelector('a');
      if (a && a.getAttribute('href') === 'artifacts.html') {
        artifactsGroups[depth0Items[d].getAttribute('data-group')] = true;
      }
    }

    var currentPath = sidebarList.getAttribute('data-current-path');
    var links = sidebarList.querySelectorAll('a');
    for (var j = 0; j < links.length; j++) {
      if (links[j].getAttribute('href') === currentPath) {
        links[j].classList.add('active');
        links[j].setAttribute('aria-current', 'page');
        var group = links[j].parentElement.getAttribute('data-group');
        // Ne pas ouvrir les enfants du groupe Artifacts (trop nombreux)
        if (!artifactsGroups[group]) {
          var children = sidebarList.querySelectorAll('.sidebar-child[data-group="' + group + '"]');
          for (var k = 0; k < children.length; k++) {
            children[k].setAttribute('data-open', 'true');
          }
        }
        break;
      }
    }
  }

  /* --- Réorganisation DOM --- */

  var contentWrap = document.getElementById('content-wrapper');
  var innerWrap = contentWrap ? contentWrap.querySelector('.inner-wrapper') : null;
  var navTabs = innerWrap ? innerWrap.querySelector('.nav-tabs') : null;
  if (navTabs && innerWrap && contentWrap) {
    innerWrap.parentNode.insertBefore(navTabs, innerWrap);
    innerWrap.classList.add('has-tabs');
  }

  var publishBox = document.querySelector('#publish-box, .publish-box');
  var segmentContent = document.getElementById('segment-content');
  if (publishBox && segmentContent) {
    segmentContent.parentNode.insertBefore(publishBox, segmentContent);
    publishBox.style.opacity = '1';
  }

  if (contentWrap) {
    var tables = contentWrap.querySelectorAll('table:not(.colsi):not(.colsd)');
    for (var t = 0; t < tables.length; t++) {
      if (tables[t].parentNode) {
        var w = document.createElement('div');
        w.className = 'table-scroll-wrapper';
        tables[t].parentNode.insertBefore(w, tables[t]);
        w.appendChild(tables[t]);
      }
    }
  }

  var cells = document.querySelectorAll('td.hierarchy');
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].textContent.trim() === '0 Table of Contents') {
      cells[i].parentElement.style.display = 'none';
    }
  }


  /* --- Drawer mobile --- */

  var navToggle = document.getElementById('nav-toggle');
  var sidebarWrapper = document.getElementById('sidebar-wrapper');
  var overlay = document.getElementById('mobile-overlay');

  function getFocusable() {
    return sidebarWrapper.querySelectorAll('a[href], button:not([disabled])');
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var f = getFocusable();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeDrawer();
    else trapFocus(e);
  }

  function openDrawer() {
    sidebarWrapper.classList.add('open');
    sidebarWrapper.setAttribute('role', 'dialog');
    sidebarWrapper.setAttribute('aria-modal', 'true');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    var f = getFocusable();
    if (f.length) f[0].focus();
  }

  function closeDrawer() {
    sidebarWrapper.classList.remove('open');
    sidebarWrapper.removeAttribute('role');
    sidebarWrapper.removeAttribute('aria-modal');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    navToggle.focus();
  }

  if (navToggle) {
    navToggle.addEventListener('click', function() {
      sidebarWrapper.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }

  // Fermer le drawer au click sur un lien de navigation (sinon il reste ouvert
  // pendant le chargement de la page suivante ou le scroll vers une ancre).
  if (sidebarWrapper) {
    var sidebarLinks = sidebarWrapper.querySelectorAll('a[href]');
    for (var sl = 0; sl < sidebarLinks.length; sl++) {
      sidebarLinks[sl].addEventListener('click', function() {
        if (sidebarWrapper.classList.contains('open')) closeDrawer();
      });
    }
  }

  // Si l'utilisateur élargit la fenêtre au-dessus du breakpoint mobile alors
  // que le drawer est ouvert, on remet l'état desktop propre (sinon body reste
  // figé par overflow:hidden et le focus trap reste actif).
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 992 && sidebarWrapper.classList.contains('open')) {
      closeDrawer();
    }
  });


  /* --- Table des matières (TOC) --- */

  var sidebarNav = document.getElementById('sidebar-nav');
  var innerContent = document.querySelector('#content-wrapper > .inner-wrapper');
  if (sidebarNav && innerContent) {
    var origToc = document.querySelector('.markdown-toc');
    if (origToc) origToc.style.display = 'none';

    var allHeadings = innerContent.querySelectorAll('h2[id], h3[id], h4[id]');
    var headings = [];
    var seenIds = {};
    for (var j = 0; j < allHeadings.length; j++) {
      var h = allHeadings[j];

      // 1. Exclure les tabs Bootstrap inactifs (structure standard .tab-pane).
      //    Couvre les onglets niveau 1 des pages profil FHIR (Content / Mappings / XML / JSON).
      var tabPane = h.closest('.tab-pane');
      if (tabPane && !tabPane.classList.contains('active')) continue;

      // 2. Exclure les éléments réellement cachés en CSS (display:none hérité
      //    d'un ancêtre). Couvre les tabs imbriqués, accordéons fermés, etc.,
      //    sans supposer une structure HTML particulière. Générique : marche
      //    pour tout mécanisme standard de masquage par display:none.
      if (h.offsetParent === null) continue;

      // 3. Dédupliquer par id : un ancre doit être unique dans le document.
      //    Si le publisher en génère plusieurs avec le même id (cas observé
      //    sur les vues multiples d'un même profil), on ne garde que la première.
      //    Pas de déduplication par texte : deux sections distinctes peuvent
      //    légitimement porter le même intitulé.
      if (seenIds[h.id]) continue;
      seenIds[h.id] = true;

      headings.push(h);
    }

    if (headings.length > 0) {
      var tocSection = document.createElement('div');
      tocSection.className = 'sidebar-toc-section';

      var tocWrap = document.createElement('div');
      tocWrap.className = 'sidebar-toc-wrapper';

      var tocTitle = document.createElement('div');
      tocTitle.className = 'sidebar-toc-title';
      tocTitle.textContent = 'Sur cette page';
      tocWrap.appendChild(tocTitle);

      var tocNav = document.createElement('nav');
      tocNav.className = 'sidebar-page-toc';
      var tocUl = document.createElement('ul');

      var skippedFirstH2 = false;
      for (var m = 0; m < headings.length; m++) {
        var heading = headings[m];
        var tag = heading.tagName.toLowerCase();
        if (tag === 'h2' && !skippedFirstH2) { skippedFirstH2 = true; continue; }
        var text = heading.textContent.replace(/^\s*[\d.]+\s*/, '').trim();
        if (!text) continue;

        var li = document.createElement('li');
        if (tag === 'h3') li.style.paddingLeft = '12px';
        if (tag === 'h4') li.style.paddingLeft = '24px';

        var tocLink = document.createElement('a');
        tocLink.href = '#' + heading.id;
        tocLink.textContent = text;
        li.appendChild(tocLink);
        tocUl.appendChild(li);
      }

      tocNav.appendChild(tocUl);

      // Ne pas afficher la TOC si elle est vide
      if (tocUl.children.length === 0) {
        // rien
      } else {
        tocWrap.appendChild(tocNav);
        tocSection.appendChild(tocWrap);

        // TOC intégrée dans le flux de la sidebar
        sidebarNav.appendChild(tocSection);
      }

      // Scroll spy (met en évidence la section active dans la TOC)
      var tocAllLinks = tocUl.querySelectorAll('a');
      if (tocAllLinks.length > 0) {
        var spyHeadings = [];
        for (var s = 0; s < tocAllLinks.length; s++) {
          var id = tocAllLinks[s].getAttribute('href');
          var target = id ? document.querySelector(id) : null;
          if (target) spyHeadings.push({ link: tocAllLinks[s], target: target });
        }

        function setActiveTocLink(link) {
          for (var i = 0; i < tocAllLinks.length; i++) {
            tocAllLinks[i].classList.remove('toc-active');
            tocAllLinks[i].removeAttribute('aria-current');
          }
          if (link) {
            link.classList.add('toc-active');
            link.setAttribute('aria-current', 'location');
          }
        }

        // Click direct sur un lien TOC : on fixe l'état actif immédiatement.
        // Sinon l'IntersectionObserver peut rater le scroll si la cible atterrit
        // hors de la zone -10%/-80%. On suspend l'observer pendant 800ms pour
        // ne pas écraser le choix utilisateur pendant le scroll smooth.
        var clickLockUntil = 0;
        for (var s = 0; s < tocAllLinks.length; s++) {
          (function(link) {
            link.addEventListener('click', function() {
              setActiveTocLink(link);
              clickLockUntil = Date.now() + 800;
            });
          })(tocAllLinks[s]);
        }

        // IntersectionObserver : quand un heading entre dans la zone de lecture
        if ('IntersectionObserver' in window) {
          var headingObserver = new IntersectionObserver(function(entries) {
            if (Date.now() < clickLockUntil) return;
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var id = '#' + entry.target.id;
                for (var s = 0; s < spyHeadings.length; s++) {
                  if ('#' + spyHeadings[s].target.id === id) {
                    setActiveTocLink(spyHeadings[s].link);
                    break;
                  }
                }
              }
            });
          }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

          for (var s = 0; s < spyHeadings.length; s++) {
            headingObserver.observe(spyHeadings[s].target);
          }
        }
      }
    }
  }
})();
