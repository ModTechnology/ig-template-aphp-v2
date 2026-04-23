# ig-template-aphp

Template pour les guides d'implémentation FHIR publiés par l'AP-HP.

Basé sur le [template FHIR de base](https://github.com/HL7/ig-template-fhir) (`fhir.base.template`), ce template ajoute la charte graphique AP-HP, une navigation latérale hiérarchisée, une table des matières par page et un comportement responsive.

## Fonctionnalités

- Navigation latérale avec hiérarchie des pages (générée depuis `site.data.pages`)
- Table des matières « Sur cette page » (h2, h3, h4) avec scroll spy
- Menu responsive : drawer hamburger en tablette et mobile (WAI-ARIA conforme)
- Onglets des pages ressources stylisés (Content, Definitions, Mappings, etc.)
- Filtrage automatique des sous-pages d'onglets dans la sidebar
- Police Inter auto-hébergée (aucune dépendance externe au build)
- Publish-box repositionnée en pleine largeur
- Compatible avec le FHIR IG Publisher ≥ 2.2.0

## Installation

Dans le `ig.ini` de votre projet IG :

```ini
[IG]
ig = fsh-generated/resources/ImplementationGuide-mon-ig.json
template = ig-template-aphp
```

Deux façons d'utiliser le template :

1. **Copie locale** : copier le dossier `ig-template-aphp/` à la racine du projet IG.
2. **Référence distante** : pointer directement vers ce dépôt :

   ```ini
   template = https://github.com/aphp/ig-template-aphp
   ```

## Prérequis

- FHIR IG Publisher ≥ 2.2.0
- Java 17+
- Jekyll (installé via Ruby, ou intégré au publisher)

## Structure

```
ig-template-aphp/
├── content/
│   └── assets/
│       ├── css/aphp-ig.css          Styles principaux
│       ├── fonts/                    Police Inter (WOFF2)
│       ├── ico/favicon.png
│       ├── images/aphp-logo.png
│       └── js/sidebar-nav.js        Navigation, TOC, drawer, scroll spy
├── includes/
│   ├── fragment-pagebegin.html      Header, navbar, sidebar (Liquid)
│   ├── fragment-pageend.html        Footer, scripts
│   ├── _append.fragment-css.html    Chargement des CSS
│   ├── _append.fragment-header.html Logo AP-HP
│   └── _append.fragment-footer.html Mention de licence
└── package/
    └── package.json                 Métadonnées du template
```

## Personnalisation

Les couleurs de la charte sont définies dans les variables CSS de `aphp-ig.css` (section `:root`) et peuvent être adaptées pour un autre établissement.

La sidebar est construite en Liquid à partir de `site.data.pages` ; la hiérarchie est déduite des labels attribués par le publisher. La détection de la page active et l'ouverture du groupe correspondant sont gérées côté client pour optimiser le temps de build sur les IG volumineux.

## Licence

CC0-1.0
