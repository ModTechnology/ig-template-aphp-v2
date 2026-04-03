/**
 * sidebar-nav.js
 * Navigation latérale et ajustements DOM pour le template AP-HP.
 */
(function() {

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
  }

  if (contentWrap) {
    var tables = contentWrap.querySelectorAll('table:not(.colsi)');
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


  /* --- Navigation latérale --- */

  var sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var pages = (typeof SITE_PAGES !== 'undefined') ? SITE_PAGES : [];

  function compareLabels(a, b) {
    var pa = a.split('.').map(Number);
    var pb = b.split('.').map(Number);
    for (var n = 0; n < Math.max(pa.length, pb.length); n++) {
      var da = (pa[n] !== undefined) ? pa[n] : 0;
      var db = (pb[n] !== undefined) ? pb[n] : 0;
      if (da !== db) return da - db;
    }
    return 0;
  }

  function getParentLabel(label) {
    var parts = label.split('.');
    if (parts.length === 1) return null;
    if (parts.length === 2 && parts[1] === '0') return null;
    if (parts.length === 2) return parts[0] + '.0';
    if (parts[parts.length - 1] === '0') {
      var base = parts.slice(0, -1);
      base.pop();
      return base.length ? base.join('.') + '.0' : null;
    }
    return parts.slice(0, -1).join('.') + '.0';
  }

  // Filtrage des sous-pages d'onglets
  var baseHrefs = {};
  var baseTitles = {};
  for (var p = 0; p < pages.length; p++) {
    baseHrefs[pages[p].href.replace(/\.html$/, '')] = true;
    baseTitles[pages[p].title] = true;
  }
  pages = pages.filter(function(page) {
    var dashIdx = page.title.lastIndexOf(' - ');
    if (dashIdx > 0 && baseTitles[page.title.substring(0, dashIdx)]) return false;

    var href = page.href.replace(/\.html$/, '');
    var suffixes = ['-definitions', '-mappings', '-examples', '-testing',
      '-changes', '-history', '-profiles', '-notes', '-download'];
    for (var s = 0; s < suffixes.length; s++) {
      if (href.endsWith(suffixes[s]) && baseHrefs[href.slice(0, -suffixes[s].length)]) return false;
    }

    var fmtMatch = href.match(/^(.+?)(?:\.profile)?\.(xml|json|ttl)$/);
    if (fmtMatch && baseHrefs[fmtMatch[1]]) return false;

    return true;
  });

  // Construction de l'arbre
  pages.sort(function(a, b) { return compareLabels(a.label, b.label); });

  var labelMap = {};
  var root = [];

  pages.forEach(function(page) {
    if (page.label === '0.0' || page.label === '0') return;

    var node = { title: page.title, href: page.href, label: page.label, children: [] };
    labelMap[page.label] = node;

    var parentLabel = getParentLabel(page.label);
    if (parentLabel && labelMap[parentLabel]) {
      labelMap[parentLabel].children.push(node);
    } else {
      root.push(node);
    }
  });

  function isActive(item) {
    if (item.href === currentPage) return true;
    for (var c = 0; c < item.children.length; c++) {
      if (isActive(item.children[c])) return true;
    }
    return false;
  }

  function buildList(items, ul) {
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.title;
      if (item.href === currentPage) a.className = 'active';
      li.appendChild(a);

      if (item.children.length > 0) {
        var sub = document.createElement('ul');
        sub.className = 'sidebar-sub' + (isActive(item) ? ' open' : '');
        buildList(item.children, sub);
        li.appendChild(sub);
      }

      ul.appendChild(li);
    }
  }

  buildList(root, sidebar);


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
    var allHeadings = innerContent.querySelectorAll('h2[id], h3[id], h4[id]');
    var headings = [];
    for (var k = 0; k < allHeadings.length; k++) {
      var tabPane = allHeadings[k].closest('.tab-pane');
      if (tabPane && !tabPane.classList.contains('active')) continue;
      headings.push(allHeadings[k]);
    }

    if (headings.length > 0) {
      var origToc = document.querySelector('.markdown-toc');
      if (origToc) origToc.style.display = 'none';

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

      for (var m = 0; m < headings.length; m++) {
        var heading = headings[m];
        var tag = heading.tagName.toLowerCase();
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
      tocWrap.appendChild(tocNav);
      tocSection.appendChild(tocWrap);
      sidebarNav.appendChild(tocSection);
    }
  }


  /* --- Hauteurs sidebar --- */

  var sNavEl = document.getElementById('sidebar-nav');
  var sListEl = document.getElementById('sidebar-list');
  var sTocEl = sNavEl ? sNavEl.querySelector('.sidebar-toc-section') : null;
  if (sNavEl && sListEl && sTocEl) {
    var availH = window.innerHeight - 70;
    sListEl.style.maxHeight = Math.floor(availH * 0.6) + 'px';
    sListEl.style.overflowY = 'auto';
    sTocEl.style.maxHeight = Math.floor(availH * 0.4) + 'px';
  }

})();
