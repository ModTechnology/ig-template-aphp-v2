(function() {
  // Move tabs out of .inner-wrapper so blue bg only applies to content
  var contentWrap = document.getElementById('content-wrapper');
  var innerWrap = contentWrap ? contentWrap.querySelector('.inner-wrapper') : null;
  var navTabs = innerWrap ? innerWrap.querySelector('.nav-tabs') : null;
  if (navTabs && innerWrap && contentWrap) {
    contentWrap.insertBefore(navTabs, innerWrap);
    innerWrap.classList.add('has-tabs');
  }

  // Move publish box below navbar, full width, before content columns
  var publishBox = document.querySelector('#publish-box, .publish-box');
  var segmentContent = document.getElementById('segment-content');
  if (publishBox && segmentContent) {
    segmentContent.parentNode.insertBefore(publishBox, segmentContent);
  }


  // Wrap wide tables in a scrollable container
  var contentWrapper = document.getElementById('content-wrapper');
  if (contentWrapper) {
    var tables = contentWrapper.querySelectorAll('table:not(.colsi)');
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }

  // Hide "0 Table of Contents" row in TOC tables
  var cells = document.querySelectorAll('td.hierarchy');
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].textContent.trim() === '0 Table of Contents') {
      cells[i].parentElement.style.display = 'none';
    }
  }

  var sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var pages = (typeof SITE_PAGES !== 'undefined') ? SITE_PAGES : [];

  function compareLabels(a, b) {
    var pa = a.split('.').map(Number);
    var pb = b.split('.').map(Number);
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var da = (pa[i] !== undefined) ? pa[i] : 0;
      var db = (pb[i] !== undefined) ? pb[i] : 0;
      if (da !== db) return da - db;
    }
    return 0;
  }

  // Handles mixed formats: "1", "2.0", "2.1", "3.1.0", "3.1.1", "5.10"
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
    for (var i = 0; i < item.children.length; i++) {
      if (isActive(item.children[i])) return true;
    }
    return false;
  }

  function buildList(items, ul) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
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

  // Hamburger → opens sidebar drawer (tablet + mobile)
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

  // Move in-page TOC (.markdown-toc) into sidebar — sticky at bottom
  var pageToc = document.querySelector('.markdown-toc');
  if (pageToc) {
    var sidebarNav = document.getElementById('sidebar-nav');
    if (sidebarNav) {
      var tocSection = document.createElement('div');
      tocSection.className = 'sidebar-toc-section';

      var wrapper = document.createElement('div');
      wrapper.className = 'sidebar-toc-wrapper';

      var tocTitle = document.createElement('div');
      tocTitle.className = 'sidebar-toc-title';
      tocTitle.textContent = 'Sur cette page';
      wrapper.appendChild(tocTitle);

      pageToc.className = 'sidebar-page-toc';
      wrapper.appendChild(pageToc);

      tocSection.appendChild(wrapper);
      sidebarNav.appendChild(tocSection);
    }
  }
})();
