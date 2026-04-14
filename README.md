# ig-template-aphp

Template pour les guides d'implémentation FHIR publiés par l'AP-HP.

Basé sur le [template FHIR de base](https://github.com/HL7/ig-template-fhir) (`fhir.base.template`), ce template ajoute la charte graphique AP-HP et une navigation latérale.

## Fonctionnalités

- Navigation latérale avec hiérarchie des pages (générée depuis `site.data.pages`)
- Table des matières "Sur cette page" (h2, h3, h4)
- Menu responsive : drawer hamburger sur tablette et mobile
- Onglets des pages ressources stylisés (Content, Definitions, Mappings, etc.)
- Filtrage automatique des sous-pages d'onglets dans la sidebar
- Police Inter auto-hébergée (aucune dépendance externe au build)
- Publish-box repositionnée en pleine largeur
- Compatible avec le FHIR IG Publisher v2.2+

## Installation

Dans le `ig.ini` de votre IG :

```ini
[IG]
ig = fsh-generated/resources/ImplementationGuide-mon-ig.json
template = ig-template-aphp
```

Puis copier le dossier `ig-template-aphp` à la racine de votre projet IG.

Ou pointer directement vers le dépôt :

```ini
template = https://github.com/ModTechnology/ig-template-aphp-v2
```

## Structure

```
ig-template-aphp/
├── content/
│   └── assets/
│       ├── css/aphp-ig.css          # Styles principaux
│       ├── fonts/                    # Police Inter (woff2)
│       ├── ico/favicon.png
│       ├── images/aphp-logo.png
│       └── js/sidebar-nav.js        # Navigation, TOC, drawer
├── includes/
│   ├── fragment-pagebegin.html      # En-tête, navbar, sidebar (Liquid)
│   ├── fragment-pageend.html        # Pied de page, scripts
│   ├── _append.fragment-css.html    # Chargement des CSS
│   ├── _append.fragment-header.html # Logo AP-HP
│   ├── _append.fragment-footer.html # Licence
│   ├── fragment-intro.html          # Introductions de ressources
│   └── img.html                     # Helper image
└── package/
    └── package.json                 # Métadonnées du template
```

## Personnalisation

### Charte graphique

Les couleurs sont définies dans les variables CSS de `aphp-ig.css` (section `:root`) et peuvent être modifiées pour adapter le template à un autre établissement.

### Navigation

La sidebar est construite en Liquid à partir de `site.data.pages`. La hiérarchie est déduite des labels attribués par le publisher. Le filtrage des sous-pages d'onglets se fait via un `{% unless %}` combiné dans la boucle.

La détection de la page active et l'ouverture du groupe correspondant sont gérées côté client (JS) pour optimiser le temps de build.

## Synchronisation avec le template upstream

Si le template AP-HP de base ([aphp/ig-template-aphp](https://github.com/aphp/ig-template-aphp)) est mis à jour :

```bash
git remote add upstream https://github.com/aphp/ig-template-aphp.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

Résoudre les conflits en conservant nos fichiers modifiés (`fragment-pagebegin.html`, `fragment-pageend.html`, `aphp-ig.css`, `sidebar-nav.js`).

## Prérequis

- FHIR IG Publisher >= 2.2.0
- Java 17+
- Jekyll (installé via Ruby ou intégré au publisher)

## Licence

CC0-1.0
