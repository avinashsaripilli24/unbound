# studio Unbound website

A plain HTML, CSS and JavaScript site. There is nothing to install or build: open `index.html` in a browser to view it, and upload this folder to any web host to publish it.

## What is here

| File | What it is |
| --- | --- |
| `index.html` | Home: the slate visitors can draw on, the doorway drawing that changes as they scroll, what the studio puts in writing |
| `story.html` | Our Story: who we are, the six sketch studies, the team, the workshop |
| `services.html` | Design, Build and the six Unbound sub-brands |
| `process.html` | How We Work: the five stages and the register of documents a client receives |
| `why.html` | Why Unbound |
| `contact.html` | The project brief (enquiry form) and the questions clients ask first |
| `404.html` | Shown by the host when a page is not found |
| `assets/js/config.js` | **Your settings**: contact details, company details, enquiry delivery, photographs |
| `assets/js/lang/te.js`, `hi.js` | Telugu and Hindi text |
| `assets/css/style.css` | All styling. Colours and fonts are at the top |
| `assets/img/` | Logo, icons and the image used when a link is shared |

## Before going live

Open `assets/js/config.js` and fill in:

1. **Contact details**: phone, WhatsApp number, email, Instagram, map link.
2. **Company details**: year established, registration number, GSTIN, studio address. These appear in the footer and are what people look for before they trust a firm.
3. **Where enquiries go**: either a Web3Forms access key (free, emails each enquiry to the studio) or your own form endpoint. Until one is set, the form opens WhatsApp or email with the enquiry already written; if those are empty too, it tells the visitor the form is not connected.
4. **Photographs**: put files in a new folder `assets/photos/` and write each path next to its name in `config.js`. Each sketch stays as a small mark beside its photo.

Anything left empty stays hidden, so the site never shows a placeholder. After publishing, send one test enquiry and confirm it arrives.

## Changing the words

- **English** lives in the `.html` files. Change the text between the tags and leave the `data-i18n="..."` labels alone.
- **Telugu and Hindi** live in `assets/js/lang/te.js` and `hi.js`. Each line is `"label": "text"`; the label matches the `data-i18n` label in the HTML.
- When you change an English sentence, change the same label in both language files, or visitors in those languages will see the old sentence.
- The header and footer are repeated in every page, so a change to the menu has to be made in all seven files.

## How the two drawings work

- **The slate (top of Home).** A visitor drags to draw. A rough stroke becomes a straight measured line, a closed loop becomes a circle with its radius, a stroke that rises and returns becomes an arched opening, and a tap becomes a dot. On phones a sideways drag draws and an up-and-down swipe still scrolls. "Clean slate" wipes it.
- **The doorway (Home, "from idea to object").** One drawing with five layers: sketch, measured drawing, materials, joinery detail, finished object. Each layer appears as its paragraph reaches the middle of the screen.

Both are drawn in code inside `index.html`, so they stay sharp at any size and need no image files.

## Themes and languages

- Light and dark follow the visitor's device setting until they press the toggle; their choice is then remembered. The slate at the top of Home is dark in both.
- English is the default. Telugu and Hindi load only when chosen, and the choice is remembered.
- A link can open the site in a set language or theme: `index.html?lang=te`, `index.html?lang=hi&theme=dark`.
- The typeface is Comfortaa throughout, with Century Gothic as the fallback.

## Putting it online

Upload the contents of this folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, or ordinary shared hosting) and point the domain at it. Once the domain is known, replace `assets/img/share.jpg` in each page's `og:image` tag with the full address (for example `https://your-domain/assets/img/share.jpg`) so link previews show the image.
