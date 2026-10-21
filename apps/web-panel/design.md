# High Protein, Keto-Friendly, 0g Sugar Cereal | Magic Spoon Cereal design system

> Extracted by [Inspo](https://github.com/Nutlope/inspo) (open source, MIT, powered by Together AI). Reference material for *intentional* design decisions: adapt, don't copy.

> Save this as `DESIGN.md` in your project and re-reference it as you build; re-fetch anytime at https://inspomcp.dev/d/magicspoon-com/DESIGN.md

- **Source:** https://magicspoon.com
- **Captured:** 2026-06-03
- **Mode:** light
- **Macrostructure:** Bento Grid
- **Stack:** Shopify, Tailwind

## Tone

Magic Spoon is high-protein, keto-friendly, gluten-free cereal with 0g of sugar. Available in Cocoa, Frosted, Blueberry, Peanut Butter and Cinnamon.  ·  playful, minimalism, ecommerce, health, hero-with-cta, feature-trio, hero-fullbleed, logo-cloud, feature-alternating

## Colors

| Hex | Role (heuristic) |
|---|---|
| `#0404fc` | ink |
| `#f4e687` | surface (raised) |
| `#3f0aa9` | ink |
| `#49956e` | support |
| `#ceadd1` | muted |

## Typography

Detected typefaces: **Poppins**, **Arial**

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| h1 | Poppins | 60px | 700 | 1.05 | 0 |
| h2 | Poppins | 28px | 500 | 1.25 | 0 |
| h3 | Poppins | 32px | 700 | 1.25 | 0 |
| body | Poppins | 16px | 400 | 1 | 0 |
| button | Arial | 13px | 400 | 1.4 | 0 |

## Spacing scale

`5px` · `10px` · `15px` · `20px` · `25px` · `30px` · `37px` · `40px` · `50px` · `57px` · `65px` · `70px` · `80px` · `90px` · `100px` · `112px` · `115px` · `140px`

Base step looks like **10px**.

## Border radius

`0px` · `15px` · `25px` · `28px` · `30px` · `40px` · `50px`

## Container

Max content width: **1440px**

## CSS variables exposed by the source

```css
:root {
  --oke-border-width: 1px;
  --oke-text-primaryColor: #3f0791;
  --header-height: 0px;
  --oke-text-regular: 14px;
  --rb-smart-search-quick-view-product-title-color: #232323;
  --oke-button-borderColorHover: #3f0791;
  --oke-stars-backgroundColor: #fff;
  --rb-smart-search-results-reviews-background-color: #E5E5E5;
  --oke-button-backgroundColorActive: #3f0791;
  --oke-filter-backgroundColor: #fff;
  --rb-smart-search-results-product-title-color: #232323;
  --rb-widget-input-border-focus-color: #3f0791;
  --oke-attributeBar-shadingColor: #9a9db1;
  --oke-stars-foregroundColor: #3f0791;
  --oke-filter-borderColor: #3f0791;
  --rb-smart-search-results-pagination-button-text-color: #ffffff;
  --oke-button-borderColorActive: #3f0791;
  --rb-widget-option-background: transparent;
  --oke-button-textColor: #fff;
  --oke-filter-borderColorActive: #3f0791;
  --rb-smart-search-results-product-price-sale-color: #44BE70;
  --rb-smart-search-quick-view-button-background-color: #3f0791;
  --rb-smart-search-results-product-price-compare-at-color: #9a9a9a;
  --oke-highlightColor: #3f0791;
  --rb-widget-option-selected-color: #3f0791;
  --oke-filter-searchHighlightColor: #b2f9e9;
  --oke-button-textColorHover: #fff;
  --oke-text-small: 12px;
  --oke-text-large: 1.625em;
  --rb-smart-search-quick-view-button-text-color: #ffffff;
  --WHITE-COLOR: #fff;
  --rb-smart-search-results-content-inactive-tab-color: #546b7d;
  --rb-smart-search-quick-view-product-price-compare-at-color: #9a9a9a;
  --rb-widget-progress-bar-fill: #3f0791;
  --rb-smart-search-results-product-price-color: #535353;
  --oke-button-borderColor: #3f0791;
  --oke-border-color: #3f0791;
  --swiper-theme-color: #007aff;
  --oke-button-fontSize: 14px;
  --rb-smart-search-quick-view-product-price-sale-color: #44BE70;
  --oke-starRating-spaceBelow: 0;
  --rb-smart-search-quick-view-reviews-foreground-color: #FBCA10;
  --oke-filter-textColor: #3f0791;
  --oke-attributeBar-borderColor: undefined;
  --rb-smart-search-quick-view-reviews-background-color: #E5E5E5;
  --oke-starRating-spaceAbove: 0;
  --oke-button-textColorActive: #fff;
  --header-stack-offset: 42.40625px;
  --rb-smart-search-results-content-description-color: #405768;
  --rb-smart-search-results-reviews-text-color: #535353;
  --rb-smart-search-quick-view-reviews-text-color: #535353;
  --rb-widget-option-border-color: #cccccc;
  --oke-widget-spaceAbove: 40px;
  --rb-smart-search-quick-view-button-radius: 20px;
  --rb-widget-progress-bar-track: #ececec;
  --sf-z-index-program-widget-modal: 2147483000;
  --oke-widget-spaceBelow: 20px;
  --oke-attributeBar-backgroundColor: #d3d4dd;
  --rb-smart-search-quick-view-button-border-width: 0px;
  --swiper-navigation-size: 44px;
}
```

## Components present

- hero with cta
- feature trio
- hero fullbleed
- logo cloud
- feature alternating

## Notes for the agent

- **Adapt, don't copy.** The type ramp is a *starting point*. Scale it to your project's base size; preserve the *ratio*, not the literal pixels.
- **Color roles are heuristic** (luminance + dominance). Verify against the source URL before committing tokens.
- **Spacing** assumes a constant base step; round detected values to your project's scale (4 / 8 / 16) when implementing.
- **CSS variables** dumped above (when present) are the source's *actual* tokens - those are higher signal than guesses.
- This page's macrostructure is **Bento Grid**.

---

*Generated by Inspo. Open source under MIT, owned and operated by [Together AI](https://www.together.ai). Original site copyright remains with its authors.*