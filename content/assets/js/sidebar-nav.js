/**
 * sidebar-nav.js
 * Ajustements DOM et fonctionnalités interactives pour le template AP-HP.
 * La navigation latérale est générée en Liquid (fragment-pagebegin.html).
 */
(function() {

  /* --- Page active dans le sidebar --- */

  var sidebarList = document.getElementById('sidebar-list');
  if (sidebarList) {
    var currentPath = sidebarList.getAttribute('data-current-path');
    var links = sidebarList.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href') === currentPath) {
        links[i].classList.add('active');
        var group = links[i].parentElement.getAttribute('data-group');
        var children = sidebarList.querySelectorAll('.sidebar-child[data-group="' + group + '"]');
        for (var k = 0; k < children.length; k++) {
          children[k].setAttribute('data-open', 'true');
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


  /* --- Table des matières (TOC) — déplacement dans le sidebar --- */

  var sidebarNav = document.getElementById('sidebar-nav');
  var pageToc = document.querySelector('.markdown-toc');
  if (sidebarNav && pageToc) {
    var tocSection = document.createElement('div');
    tocSection.className = 'sidebar-toc-section';

    var tocWrap = document.createElement('div');
    tocWrap.className = 'sidebar-toc-wrapper';

    var tocTitle = document.createElement('div');
    tocTitle.className = 'sidebar-toc-title';
    tocTitle.textContent = 'Sur cette page';
    tocWrap.appendChild(tocTitle);

    pageToc.className = 'sidebar-page-toc';
    tocWrap.appendChild(pageToc);
    tocSection.appendChild(tocWrap);
    sidebarNav.appendChild(tocSection);
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
