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
    contentWrap.insertBefore(navTabs, innerWrap);
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

  function openDrawer() {
    sidebarWrapper.classList.add('open');
    overlay.classList.add('visible');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    sidebarWrapper.classList.remove('open');
    overlay.classList.remove('visible');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    
    navToggle.addEventListener('click', function() {
      sidebarWrapper.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }


  /* --- Table des matières (TOC) --- */

  var sidebarNav = document.getElementById('sidebar-nav');
  var innerContent = document.querySelector('#content-wrapper > .inner-wrapper');
  if (sidebarNav && innerContent) {
    var origToc = document.querySelector('.markdown-toc');
    if (origToc) origToc.style.display = 'none';

    var allHeadings = innerContent.querySelectorAll('h2[id], h3[id], h4[id]');
    var headings = [];
    for (var j = 0; j < allHeadings.length; j++) {
      var tabPane = allHeadings[j].closest('.tab-pane');
      if (tabPane && !tabPane.classList.contains('active')) continue;
      headings.push(allHeadings[j]);
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
      if (tocUl.children.length === 0) return;

      tocWrap.appendChild(tocNav);
      tocSection.appendChild(tocWrap);

      // TOC fixed en bas à gauche, alignée avec le sidebar
      var sidebarWrap = document.getElementById('sidebar-wrapper');
      sidebarWrap.appendChild(tocSection);

      var footer = document.getElementById('segment-footer');

      function positionToc() {
        var swRect = sidebarWrap.getBoundingClientRect();
        tocSection.style.left = swRect.left + 'px';
        tocSection.style.width = swRect.width + 'px';

        // Remonter la TOC au-dessus du footer
        if (footer) {
          var footerTop = footer.getBoundingClientRect().top;
          var distanceFromBottom = window.innerHeight - footerTop;
          if (distanceFromBottom > 0) {
            tocSection.style.bottom = (distanceFromBottom + 10) + 'px';
          } else {
            tocSection.style.bottom = '20px';
          }
        }
      }
      positionToc();
      window.addEventListener('resize', positionToc);
      window.addEventListener('scroll', positionToc);

      // Scroll spy
      var tocAllLinks = tocUl.querySelectorAll('a');
      var spyHeadings = [];
      for (var s = 0; s < tocAllLinks.length; s++) {
        var id = tocAllLinks[s].getAttribute('href');
        if (id) spyHeadings.push({ link: tocAllLinks[s], target: document.querySelector(id) });
      }

      var ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          requestAnimationFrame(function() {
            var current = null;
            for (var s = 0; s < spyHeadings.length; s++) {
              if (spyHeadings[s].target && spyHeadings[s].target.getBoundingClientRect().top <= 100) {
                current = spyHeadings[s].link;
              }
            }
            for (var s = 0; s < tocAllLinks.length; s++) {
              tocAllLinks[s].classList.remove('toc-active');
            }
            if (current) current.classList.add('toc-active');
            ticking = false;
          });
          ticking = true;
        }
      });
    }
  }
})();
