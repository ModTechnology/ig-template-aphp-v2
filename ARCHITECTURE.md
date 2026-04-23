# Template AP-HP — documentation technique des évolutions

Document de spécification des modifications apportées au template. Destiné au lead dev pour validation et au développeur qui reprendra le travail.

## Synthèse

### Modifications par fichier

| Fichier | Nature | Sections concernées du présent document |
|---|---|---|
| `includes/fragment-pagebegin.html` | Restructuré | §2 Sidebar, §3 Responsive |
| `includes/fragment-pageend.html` | Nettoyé (2 scripts retirés) | §11 Footer |
| `includes/_append.fragment-css.html` | Ajout police Inter + CSS custom | §4 Inter |
| `content/assets/css/aphp-ig.css` | Refait | Toutes |
| `content/assets/js/sidebar-nav.js` | Nouveau fichier | §2, §3, §5, §7 |
| `content/assets/js/anchor-hover.js` | Override du template base | §8 Ancres |
| `content/assets/fonts/inter-*.woff2` | Nouveau | §4 Inter |

### Récapitulatif des changements fonctionnels

| ID | Changement | Gain mesurable | Voir |
|---|---|---|---|
| C1 | Sidebar : logique Liquid → JavaScript | Build IG DM : 4h → 9 min | §2.1 |
| C2 | Police Inter auto-hébergée | Aucune requête externe | §4 |
| C3 | Sidebar sticky en 3 couches | 1 seul contexte de scroll | §2.2 |
| C4 | TOC "Sur cette page" | Nouveau | §5 |
| C5 | Scroll spy IntersectionObserver | Pas de listener scroll | §5.3 |
| C6 | Responsive drawer mobile | Fonctionnel < 992 px | §3 |
| C7 | A11y drawer (dialog, focus trap) | WAI-ARIA conforme | §3.3 |
| C8 | Wrap des tableaux `td.hierarchy` | Scroll horizontal évité | §9 |
| C9 | Fallback PlantUML | Pas de chevauchement | §10 |
| C10 | Nettoyage scripts obsolètes | `respond.js`, `window-hash.js` retirés | §11 |

---

## 1. Architecture générale

### 1.1 Modèle d'extension

Le template étend `fhir.base.template` via le mécanisme standard du FHIR IG Publisher :

- Fichiers préfixés `_append.` → contenu appendé au fichier upstream correspondant
- Fichiers à chemin identique → override total du fichier upstream

L'override est utilisé pour `fragment-pagebegin.html`, `fragment-pageend.html`, `aphp-ig.css`, `sidebar-nav.js`, `anchor-hover.js`.

### 1.2 Points d'intervention

```
┌─────────────────────────────────────────────────────┐
│ BUILD (Jekyll/Liquid)                               │
│   fragment-pagebegin.html  → DOM sidebar brut       │
│   fragment-pageend.html    → scripts, footer        │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ RUNTIME (navigateur)                                │
│   aphp-ig.css      → style, responsive              │
│   sidebar-nav.js   → page active, TOC, drawer, spy  │
│   anchor-hover.js  → config anchor.js (symbole #)   │
└─────────────────────────────────────────────────────┘
```

---

## 2. Sidebar

### 2.1 C1 — Migration de la logique Liquid vers JavaScript

**Problème.** Sur l'IG DM (plusieurs centaines de pages), le build dépassait 4 heures. Diagnostic : la sidebar était construite avec une détection de page active en Liquid, complexité O(N²).

**Décision.** Sortir de Liquid tout ce qui peut être déterminé côté client au chargement. Liquid ne produit plus que le DOM brut avec des `data-*`.

**Ce qui reste en Liquid** (`fragment-pagebegin.html` ligne 87) :

```liquid
{% for p in site.data.pages %}
  {% assign pg_path = p[0] %}{% assign pg = p[1] %}
  {% if pg.title and pg.label and pg.label != '' and pg.label != '0' and pg.label != '0.0' %}
    {% unless pg_path contains '-definitions.' or pg_path contains '-mappings.' or ... %}
      {% assign lp = pg.label | split: '.' %}
      {% assign ll = lp | last %}
      {% if ll == '0' %}{% assign d = lp.size | minus: 2 %}
      {% else %}{% assign d = lp.size | minus: 1 %}{% endif %}
      {% if d < 0 %}{% assign d = 0 %}{% endif %}
      <li class="sidebar-depth-{{ d }}{% if d > 0 %} sidebar-child{% endif %}"
          data-group="{{ lp | first }}">
        <a href="{{ pg_path }}">{{ pg.title | escape_once }}</a>
      </li>
    {% endunless %}
  {% endif %}
{% endfor %}
```

Points notables :

- Boucle compacte sur une seule ligne (mise en forme ci-dessus pour lisibilité, voir note §12.4)
- Un seul `{% unless ... or ... %}` combine tous les patterns d'exclusion (pages `-definitions`, `-mappings`, `-history`, `-examples`, `-testing`, `-changes`, `-profiles`, `.profile.xml`, `.profile.json`, `.profile.ttl`)
- Calcul de profondeur `d` déduit du label du publisher
- `data-group` = premier segment du label, utilisé pour regrouper les enfants d'une même section

**Ce qui est passé en JavaScript** (`sidebar-nav.js`, section "Page active + profondeur dynamique") :

```javascript
var sidebarList = document.getElementById('sidebar-list');
if (sidebarList) {
  // 1. Indentation et style selon la profondeur
  var items = sidebarList.querySelectorAll('li');
  for (var i = 0; i < items.length; i++) {
    var match = items[i].className.match(/sidebar-depth-(\d+)/);
    if (match) {
      var depth = parseInt(match[1]);
      if (depth > 0) {
        var link = items[i].querySelector('a');
        link.style.paddingLeft = (15 + depth * 14) + 'px';
        link.style.fontSize = depth === 1 ? '13px' : '12px';
        link.style.color = depth === 1 ? '#555' : '#777';
      }
    }
  }

  // 2. Détection des groupes Artifacts (non ouverts automatiquement)
  var artifactsGroups = {};
  var depth0Items = sidebarList.querySelectorAll('.sidebar-depth-0');
  for (var d = 0; d < depth0Items.length; d++) {
    var a = depth0Items[d].querySelector('a');
    if (a && a.getAttribute('href') === 'artifacts.html') {
      artifactsGroups[depth0Items[d].getAttribute('data-group')] = true;
    }
  }

  // 3. Page active + ouverture du groupe parent
  var currentPath = sidebarList.getAttribute('data-current-path');
  var links = sidebarList.querySelectorAll('a');
  for (var j = 0; j < links.length; j++) {
    if (links[j].getAttribute('href') === currentPath) {
      links[j].classList.add('active');
      links[j].setAttribute('aria-current', 'page');
      var group = links[j].parentElement.getAttribute('data-group');
      if (!artifactsGroups[group]) {
        var children = sidebarList.querySelectorAll(
          '.sidebar-child[data-group="' + group + '"]'
        );
        for (var k = 0; k < children.length; k++) {
          children[k].setAttribute('data-open', 'true');
        }
      }
      break;
    }
  }
}
```

**Résultat.** Build IG DM mesuré à ~9 min. Le coût client par page est inférieur à 5 ms (mesuré au profiler Chrome).

### 2.2 C3 — Architecture du positionnement sticky

**Contraintes à satisfaire :**

- Sidebar visible pendant le scroll (sticky)
- Doit devenir un drawer en < 992 px
- Doit inclure la TOC ajoutée dynamiquement (§5)
- Pas de chevauchement avec le footer

**Itérations expérimentées et abandonnées :**

| Itération | Approche | Raison de l'abandon |
|---|---|---|
| v1 | `position: fixed` + calcul JS de top/height au scroll | Fragile au resize, recalcul à chaque frame, chevauchement footer |
| v2 | `position: sticky` sur `#sidebar-nav` avec `overflow-y: auto` | TOC interne crée un 2ᵉ contexte de scroll imbriqué (deux scrollbars concentriques) |
| v3 (retenue) | Séparation en 3 couches | — |

**Structure retenue** (`fragment-pagebegin.html` lignes 82-92) :

```html
<div class="col-lg-3 col-md-4 sidebar-col">
  <div class="sidebar-sticky">
    <div id="sidebar-wrapper" aria-label="Navigation">
      <nav id="sidebar-nav" aria-label="Navigation principale">
        <ul class="sidebar-list" id="sidebar-list" data-current-path="{{ page.path }}">
          {% for p in site.data.pages %}...{% endfor %}
        </ul>
      </nav>
    </div>
  </div>
</div>
```

**Responsabilité par couche :**

| Élément | Rôle |
|---|---|
| `.col-lg-3 .sidebar-col` | Grille Bootstrap. La classe custom remplace `hidden-sm hidden-xs` (voir §3.2) |
| `.sidebar-sticky` | `position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto` — unique contexte de scroll interne |
| `#sidebar-wrapper` | Porte la sémantique `dialog` en mode drawer (§3.3). Aucun rôle de positionnement |
| `nav#sidebar-nav` | Conteneur sémantique. La TOC y est appendée par JS |

**CSS clé** (`aphp-ig.css` section Navigation latérale) :

```css
#sidebar-wrapper {
  padding-right: 0;
}

.sidebar-sticky {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

/* Les colonnes Bootstrap doivent être de même hauteur pour que le sticky
   puisse utiliser toute la hauteur du contenu de droite */
@media (min-width: 992px) {
  #segment-content > .container > .row {
    display: flex;
  }
}
```

**Piège à respecter.** Ne pas ajouter de `overflow-y: auto` sur un autre niveau de cette hiérarchie. Cela créerait un second contexte de scroll et casserait le sticky interne.

---

## 3. Responsive et drawer mobile

### 3.1 Breakpoints

| Seuil | Effet |
|---|---|
| ≥ 1280 px | Affichage nominal |
| 992-1279 px | Menu du header resserré (padding 12 px, font-size 15 px) |
| 768-991 px | Sidebar masquée, drawer disponible via hamburger |
| < 768 px | Idem + tailles de texte et tableaux adaptés |

### 3.2 C6 — Piège `display: none` vs `position: fixed`

**Problème.** Configuration initiale : classes Bootstrap `hidden-sm hidden-xs` sur la colonne sidebar. Ces classes appliquent `display: none !important` < 992 px. En CSS, `#sidebar-wrapper` recevait `position: fixed` en mobile avec classe `.open`. Le drawer ne s'affichait jamais.

**Cause.** Un élément `position: fixed` échappe au flux de son parent, mais pas à sa visibilité. `display: none` sur un ancêtre supprime toute la branche DOM du rendu, y compris les fixed.

**Solution retenue.**

1. Remplacement des classes Bootstrap par une classe custom `.sidebar-col` (`fragment-pagebegin.html:82`).
2. En < 992 px, la colonne est rendue mais n'occupe plus d'espace, ce qui permet à son enfant fixed de s'afficher.
3. `.sidebar-sticky` neutralisé en mobile (le sticky n'a plus de sens quand l'enfant est fixed).

**CSS correspondant** (`aphp-ig.css` section Responsive) :

```css
@media (max-width: 991px) {
  /* Colonne Bootstrap : ne prend plus d'espace mais reste rendue.
     Indispensable pour que #sidebar-wrapper en fixed soit visible. */
  .sidebar-col {
    width: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .sidebar-sticky {
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
  }

  #sidebar-wrapper {
    display: flex !important;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: -300px;
    width: 280px;
    height: 100vh;
    background: #fff;
    border-right: 1px solid #e0e0e0;
    z-index: 1000;
    transition: left 0.25s ease, box-shadow 0.25s ease;
    overflow: hidden;
    padding: 20px 0;
  }

  #sidebar-wrapper.open {
    left: 0;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  }
}
```

### 3.3 C7 — Accessibilité WAI-ARIA du drawer

**Exigences.** Le drawer doit être conforme aux règles WAI-ARIA pour les modales : focus trap, fermeture clavier, sémantique correcte.

**Implémentation** (`sidebar-nav.js` section Drawer mobile) :

```javascript
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
```

**Choix à noter :**

- `role="dialog"` ajouté uniquement quand le drawer est ouvert. Hors drawer, `#sidebar-wrapper` n'est pas un dialogue, l'attribut serait sémantiquement faux.
- Focus retourné sur `navToggle` à la fermeture : l'utilisateur reprend la navigation au même endroit.
- `body.overflow = 'hidden'` à l'ouverture : bloque le scroll de la page derrière le drawer.

---

## 4. C2 — Police Inter auto-hébergée

**Problème.**

- Chargement initial depuis Google Fonts → requêtes externes (proxy restrictif)
- Build du publisher ralenti par les requêtes HTTP par page
- Fallback de police visible au chargement dans certains contextes réseau

**Solution.** Fichiers WOFF2 embarqués dans `content/assets/fonts/`, déclarés en tête du CSS :

```css
@font-face {
  font-family: 'Inter'; font-style: normal; font-weight: 200;
  font-display: swap; src: url('../fonts/inter-200.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter'; font-style: normal; font-weight: 400;
  font-display: swap; src: url('../fonts/inter-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter'; font-style: normal; font-weight: 700;
  font-display: swap; src: url('../fonts/inter-700.woff2') format('woff2');
}
```

**Coût.** ~120 Ko (3 fichiers). Aucune dépendance externe.

---

## 5. C4 — Table des matières "Sur cette page"

### 5.1 Construction

Implémentée dans `sidebar-nav.js` section "Table des matières". Scanne `.inner-wrapper` pour les headings avec `id`.

**Règles de filtrage** (critiques pour la généricité multi-IG) :

```javascript
var allHeadings = innerContent.querySelectorAll('h2[id], h3[id], h4[id]');
var headings = [];
var seenIds = {};

for (var j = 0; j < allHeadings.length; j++) {
  var h = allHeadings[j];

  // Filtre 1 : exclure les tabs Bootstrap inactifs (structure .tab-pane)
  var tabPane = h.closest('.tab-pane');
  if (tabPane && !tabPane.classList.contains('active')) continue;

  // Filtre 2 : exclure tout élément caché par display:none hérité.
  // Couvre les tabs imbriqués (Key Elements / Differential / Snapshot sur
  // pages de profil FHIR) et tout autre mécanisme standard de masquage.
  if (h.offsetParent === null) continue;

  // Filtre 3 : déduplication par id (pas par texte).
  // Sur les profils FHIR, plusieurs sous-tabs partagent les mêmes ids.
  if (seenIds[h.id]) continue;
  seenIds[h.id] = true;

  headings.push(h);
}
```

**Pourquoi par `id` et pas par texte :** deux sections légitimement distinctes peuvent partager le même intitulé dans certains IG. L'`id` est sémantiquement unique en HTML, c'est la bonne clé de déduplication.

### 5.2 Règles de présentation

- Le premier `h2` est ignoré (doublon avec le titre de la page)
- Indentation dépendante du niveau : `h3` → 12 px, `h4` → 24 px
- Si après filtrage `headings.length === 0`, la TOC n'est pas construite

### 5.3 C5 — Scroll spy avec IntersectionObserver

**Choix.** `IntersectionObserver` plutôt qu'un listener scroll.

**Justification.** Un scroll listener se déclenche à chaque frame (jusqu'à 60 Hz). Même throttlé via `requestAnimationFrame`, il nécessite un `getBoundingClientRect()` par heading par frame. Sur les pages longues (30+ sections sur `doc-technical.md`), impact mesurable. `IntersectionObserver` est natif et déclenché uniquement aux transitions, géré par le navigateur.

**Configuration :**

```javascript
new IntersectionObserver(callback, {
  rootMargin: '-10% 0px -80% 0px',
  threshold: 0
});
```

`rootMargin` définit une bande entre 10 % et 20 % du haut du viewport : le heading actif est celui qui occupe cette zone.

### 5.4 Click sur lien TOC : override du spy

**Problème.** Au click sur un lien TOC, le scroll peut ne pas faire atterrir le heading cible dans la zone observée (si la cible est en bas de page, le scroll s'arrête avant). L'observer ne se redéclenche pas, le highlight reste sur la section précédente.

**Solution.** Fixer l'état actif immédiatement au click, suspendre l'observer 800 ms :

```javascript
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

var clickLockUntil = 0;
for (var s = 0; s < tocAllLinks.length; s++) {
  (function(link) {
    link.addEventListener('click', function() {
      setActiveTocLink(link);
      clickLockUntil = Date.now() + 800;
    });
  })(tocAllLinks[s]);
}

// Dans le callback de l'observer :
if (Date.now() < clickLockUntil) return;
```

---

## 6. Manipulations DOM au chargement

Dans `sidebar-nav.js` section "Réorganisation DOM" :

| Opération | Raison |
|---|---|
| `navTabs` sorti de `.inner-wrapper` (placé avant) | Fond bleu `has-tabs` doit entourer le contenu, pas la barre d'onglets |
| `#publish-box` remonté avant `#segment-content` | Affichage pleine largeur au lieu de confiné dans la colonne |
| `table:not(.colsi):not(.colsd)` wrappé dans `.table-scroll-wrapper` | Scroll horizontal sur mobile |
| `td.hierarchy` avec texte "0 Table of Contents" masqué | Artefact du publisher sans signification |

**Anti-flash.** Les éléments à déplacer ont `opacity: 0` par défaut en CSS, remis à 1 après déplacement :

```css
#publish-box, .publish-box { opacity: 0; }
.inner-wrapper > .nav.nav-tabs { opacity: 0; }
```

```javascript
publishBox.style.opacity = '1'; // après insertion
```

Pour `.nav-tabs`, l'opacité est rétablie par `.has-tabs` en CSS.

---

## 7. Sidebar : détection du groupe Artifacts

**Contrainte.** Le groupe de pages associé à `artifacts.html` peut contenir des centaines d'entrées (StructureDefinitions, ValueSets, CodeSystems, examples). Ouverture automatique = dégradation ergonomique.

**Implémentation.** Avant la boucle de détection de la page active, on identifie les `data-group` dont l'élément racine pointe vers `artifacts.html` :

```javascript
var artifactsGroups = {};
var depth0Items = sidebarList.querySelectorAll('.sidebar-depth-0');
for (var d = 0; d < depth0Items.length; d++) {
  var a = depth0Items[d].querySelector('a');
  if (a && a.getAttribute('href') === 'artifacts.html') {
    artifactsGroups[depth0Items[d].getAttribute('data-group')] = true;
  }
}
```

Puis au moment d'ouvrir le groupe de la page active : `if (!artifactsGroups[group])`.

**Fragilité connue.** Détection par chaîne littérale `artifacts.html`. Si cette page est renommée dans une version future du publisher, la règle est à mettre à jour. Aucun signal plus robuste n'est exposé par Liquid (`site.data.pages`).

---

## 8. C8 — Wrap des tableaux `td.hierarchy`

**Problème reporté par l'utilisateur.** Sur les pages StructureDefinition, la colonne "Type" (ex : `Reference(Patient | Practitioner | PractitionerRole | Organization)`) ne wrap pas, force un scroll horizontal, pousse la colonne Description hors écran.

**Cause.** Règle initiale `white-space: nowrap` sur toutes les `td.hierarchy`. Nécessaire pour la première colonne (arbre hiérarchique avec icônes) mais pas pour les autres.

**Solution.** Wrap autorisé par défaut, `nowrap` uniquement sur la première cellule de chaque ligne :

```css
td.hierarchy {
  background-image: none !important;
  padding: 8px 10px !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
  vertical-align: top;
}

td.hierarchy a {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
}

td.hierarchy:first-child,
td.hierarchy:first-child a {
  white-space: nowrap !important;
  word-break: normal !important;
  overflow-wrap: normal !important;
}
```

**Notes :**

- `!important` nécessaire : le publisher injecte des styles inline sur les cellules qui l'emportent sur les règles externes.
- `overflow-wrap: anywhere` autorise la coupure même au sein d'un mot long sans séparateur naturel (ex : `FRCoreObservationBodyHeightProfile`).
- Ciblage explicite de `td.hierarchy a` : les liens dans les cellules (noms de profils) portent leur propre `white-space`.

---

## 9. Ancres de titre et anchor.js

### 9.1 Décision actuelle

Les ancres générées par `anchor.js` sont masquées :

```css
.anchorjs-link {
  display: none !important;
}
```

### 9.2 Historique

- Masquées à l'origine dans le template upstream
- Rendues visibles au hover avec symbole `#` en gris clair (remplacement du `§` par défaut)
- Retour à masqué après retour utilisateur (encombrement visuel jugé gênant)

### 9.3 État de `anchor-hover.js`

Le fichier override du template base reste en place pour une réactivation éventuelle :

```javascript
anchors.options.visible = 'hover';
anchors.options.icon = '#';
anchors.add();
```

Pour réactiver l'affichage au hover : retirer la règle `display: none !important` dans `aphp-ig.css`.

---

## 10. C9 — Fallback visuel PlantUML/Graphviz

**Problème reporté.** Sur les pages contenant un diagramme PlantUML, quand Graphviz n'est pas installé dans l'environnement de build, le fallback texte s'affiche en vert vif et déborde visuellement du conteneur `.viewer-container`, chevauchant la sidebar.

Deux niveaux de correction :

### 10.1 Correction template (applicable ici)

```css
.viewer-container {
  width: 100%;
  position: relative;
  min-height: 120px;
  /* overflow: hidden retiré : cachait le fallback */
}

.viewer-container pre,
.viewer-container font[color="red"],
.viewer-container font[color="green"],
.viewer-container [style*="color:green"],
.viewer-container [style*="color: green"] {
  color: #B71C1C !important;
  font-family: 'Consolas', 'Menlo', monospace !important;
  font-size: 12px !important;
  font-weight: normal !important;
  background: #FFEBEE;
  border: 1px solid #EF9A9A;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
}
```

### 10.2 Correction côté IG (hors périmètre template)

L'IG doit installer Graphviz dans son workflow CI. Exemple GitHub Actions :

```yaml
- name: Install Graphviz
  run: sudo apt-get update && sudo apt-get install -y graphviz
```

À documenter dans chaque README d'IG utilisant PlantUML.

---

## 11. C10 — Nettoyage du footer upstream

Deux scripts retirés de `fragment-pageend.html` par rapport à la version du template base :

| Script | Raison de la suppression |
|---|---|
| `respond.min.js` | Polyfill media queries IE8. Obsolète. Erreurs CORS sur `file://` |
| `window-hash.js` | Déclenchait un clic synthétique sur les ancres au load → scrolls erratiques |

**Note importante sur les chemins des scripts restants :**

```html
<!-- Correction du préfixe sur clipboard (étaient sans {{site.data.info.assets}}) -->
<script src="{{site.data.info.assets}}assets/js/clipboard.min.js"></script>
<script src="{{site.data.info.assets}}assets/js/clipboard-btn.js"></script>
```

Sans le préfixe, le chargement échoue dès que l'IG est publié sous un sous-chemin (ex : GitHub Pages projet).

---

## 12. Points d'attention pour la suite

### 12.1 Filtres d'exclusion Liquid hardcodés

La liste des patterns `-definitions.`, `-mappings.`, `-history.`, etc. (voir §2.1) est codée en dur dans le fragment. Si une nouvelle convention apparaît dans le publisher, il faudra éditer le template. Non-bloquant, les conventions HL7 évoluent rarement.

Refactor possible : externaliser dans `site.data.aphp.sidebarExclude` et itérer en Liquid.

### 12.2 Détection du groupe Artifacts

Repose sur la valeur littérale `href="artifacts.html"` (§7). À mettre à jour si le publisher renomme cette page.

### 12.3 Composants Bootstrap 3 non utilisés

Bootstrap 3.4.1 est chargé (via le template base) et fournit Scrollspy, Affix, Collapse. Non utilisés ici car leurs implémentations (basées sur scroll listeners et `getBoundingClientRect`) sont inférieures aux primitives modernes (`IntersectionObserver`, `position: sticky`). À réévaluer si le projet migre vers Bootstrap 5.

### 12.4 Bloc `{% unless %}` sur une seule ligne

Le bloc Liquid de construction de la sidebar (`fragment-pagebegin.html:87`) est volontairement maintenu sur une seule ligne. Mise en forme multi-lignes → injection de whitespace par Liquid dans le HTML → perturbation de l'alignement CSS.

Si refacto : tester avec `{%-` et `-%}` pour trim, mais nécessite Liquid 4+ non garanti par toutes les versions du publisher.

### 12.5 Synchronisation `fhir.base.template`

En cas de mise à jour upstream, vérifier les fichiers suivants :

| Fichier | Stratégie |
|---|---|
| `prism.css`, `prism.js` | Accepter la version upstream (coloration syntaxique) |
| `fragment-pagebegin.html`, `fragment-pageend.html` | Garder notre version, ré-appliquer au besoin les nouveautés upstream |
| `_append.fragment-css.html` | Garder |
| `aphp-ig.css`, `sidebar-nav.js`, `anchor-hover.js` | Garder |

### 12.6 Accessibilité — points non couverts

Couverts : drawer, `aria-current`, ancres nav. Non couverts :

- Skip link "Aller au contenu" en début de page
- `aria-label` sur les listes de la TOC
- Contraste CSS sur certains états (à auditer avec axe-core)
