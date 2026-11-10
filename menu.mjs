#!/usr/bin/env node
/* ===========================================================================
   THE CHICKEN SHACK — MENU AND FOOD PHOTOS

   Every menu item and price lives in MENU below. This is the only place to
   edit them. Change a price, save, then either:

       node menu.mjs          (rewrites the menu inside index.html)
       npx wrangler deploy    (runs the line above automatically, then deploys)

   The menu is written into index.html as plain HTML rather than built in the
   browser, so every item and price is in the page source itself. Search
   engines and AI search crawlers that do not run JavaScript can read it.

   Sizes: a price of null hides that size entirely. To show it, replace null
   with a price string such as "$8.99". Prices must look like "$12.99"; the
   build stops with an error if one does not, so a typo never reaches the site.
=========================================================================== */

const MENU = {
  orderNote: "Must speak to someone in person to place an order",
  serviceLine: null, // off until delivery status is confirmed; set a string to show it
  cateringNote: "Ask about our celebrations — hosted in-house. We also offer catering to your home or business.",

  sections: [
    {
      /* Both dinner sections share one note, shown once beneath them. */
      group: "dinners",
      note: "All dinners include 2 sides and a dinner roll.",
      sections: [
    {
      title: "Chicken Dinners",
      table: {
        columns: ["White", "Dark", "Mixed"],
        rows: [
          { name: "2 pc",  White: "$10.99", Dark: "$6.99",  Mixed: "$8.99"  },
          { name: "4 pc",  White: "$12.99", Dark: "$8.99",  Mixed: "$10.99" },
          { name: "8 pc",  White: "$16.99", Dark: "$12.99", Mixed: "$14.99" },
          { name: "12 pc", White: "$19.99", Dark: "$16.99", Mixed: "$17.99" },
          { name: "16 pc", White: "$23.99", Dark: "$20.99", Mixed: "$21.99" },
          { name: "24 pc", White: "$34.99", Dark: "$30.99", Mixed: "$32.99" },
        ],
      },
    },
    {
      title: "Tender Dinners",
      items: [
        { name: "3 pc",  price: "$7.99"  },
        { name: "6 pc",  price: "$9.99"  },
        { name: "12 pc", price: "$18.99" },
      ],
    },
      ],
    },
    {
      title: "Wings",
      items: [
        { name: "Bone-In Wings",  sizes: { "3 pc": "$3.99", "6 pc": "$7.99", "12 pc": "$15.99" } },
        { name: "Boneless Wings", sizes: { "4 pc": "$2.99", "6 pc": "$5.99", "12 pc": "$10.99" } },
      ],
    },
    {
      title: "Sandwiches",
      note: "All sandwiches include lettuce, tomato, mayo & small fry.",
      items: [
        { name: "Chicken Bacon Ranch", sizes: { "Crispy": "$10.99", "Grilled": "$12.99" } },
        { name: "Spicy Chicken",       sizes: { "Crispy": "$9.99",  "Grilled": "$11.99" } },
        { name: "Plain Chicken",       sizes: { "Crispy": "$9.99",  "Grilled": "$11.99" } },
      ],
    },
    {
      title: "Sides",
      items: [
        { name: "Mashed Potatoes & Gravy", sizes: { "Reg": "$4.99", "Lg": "$7.99" } },
        { name: "Mac & Cheese",            sizes: { "Reg": "$5.99", "Lg": "$8.99" } },
        { name: "Coleslaw",                sizes: { "Reg": "$3.99", "Lg": "$6.99" } },
        { name: "Corn",                    sizes: { "Reg": "$4.99", "Lg": "$7.99" } },
        { name: "Green Beans",             sizes: { "Reg": "$5.99", "Lg": "$8.99" } },
        { name: "Crinkle Cut Fries",       sizes: { "Basket": "$4.99", "Box": "$6.99" } },
        { name: "Sour Cream Wedges",       sizes: { "Basket": "$6.99", "Box": null } }, // box price unknown: replace null when known
        { name: "Hashbrown Rounds",        sizes: { "Basket": "$5.99", "Box": "$7.99" } },
      ],
    },
    {
      title: "Kids’ Meals",
      note: "All kids’ meals come with applesauce & drink.",
      items: [
        { name: "Chicken Leg & Mashed Potatoes",     price: "$4.99" },
        { name: "Popcorn Chicken & French Fries",    price: "$5.99" },
        { name: "2 Chicken Strips & French Fries",   price: "$6.99" },
        { name: "Mini Corn Dogs & Hashbrown Rounds", price: "$5.99" },
      ],
    },
    {
      title: "Drinks",
      items: [
        { name: "Pepsi Products",   sizes: { "Adults": "$2.99", "Kids": "$1.99" } },
        { name: "House Brewed Tea", sizes: { "Adults": "$2.99", "Kids": "$1.99" } },
        { name: "Coffee",           price: "$2.99" },
      ],
    },
    {
      title: "Sauces",
      chips: [
        "Buffalo", "Honey Mustard", "BBQ", "Sweet Chili",
        "Nashville Hot", "Teriyaki", "Garlic Parmesan", "Hot Honey",
      ],
    },
  ],
};

/* Food photos. One entry per photo. Leave the array empty and the section
   is left out of the page entirely: no heading, no gap, no placeholder.
   Explicit width and height keep the layout from jumping while images load.

   { src: "assets/photos/wings.jpg", webp: "assets/photos/wings.webp",
     alt: "Basket of sauced bone-in wings with crinkle cut fries",
     width: 1200, height: 900 },
*/
const PHOTOS = [];

/* ------------------------------------------------------------------------ */
/* Rendering. Nothing below needs to change when prices change.             */
/* ------------------------------------------------------------------------ */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PAGE = join(dirname(fileURLToPath(import.meta.url)), "index.html");
const PRICE = /^\$\d+\.\d{2}$/;

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const problems = [];
function checkPrice(value, where) {
  if (value === null) return;
  if (typeof value !== "string" || !PRICE.test(value)) {
    problems.push(`${where}: "${value}" is not a price like "$12.99" (use null to hide a size)`);
  }
}

const flat = () => MENU.sections.flatMap((s) => (s.group ? s.sections : [s]));

function validate() {
  for (const s of flat()) {
    if (s.table) {
      for (const row of s.table.rows) {
        for (const col of s.table.columns) {
          if (!(col in row)) problems.push(`${s.title} / ${row.name}: missing ${col} price`);
          else checkPrice(row[col], `${s.title} / ${row.name} / ${col}`);
        }
      }
    }
    for (const item of s.items || []) {
      if ("price" in item) checkPrice(item.price, `${s.title} / ${item.name}`);
      for (const [size, p] of Object.entries(item.sizes || {})) checkPrice(p, `${s.title} / ${item.name} / ${size}`);
      const shown = "price" in item ? [item.price] : Object.values(item.sizes || {});
      if (!shown.some((p) => p !== null)) problems.push(`${s.title} / ${item.name}: has no price to show`);
    }
  }
  for (const [i, ph] of PHOTOS.entries()) {
    for (const key of ["src", "alt", "width", "height"]) {
      if (!ph[key]) problems.push(`PHOTOS[${i}]: missing ${key}`);
    }
  }
}

/* Each size is its own unbreakable chunk, but the line can wrap between
   chunks, so a long row like "3 pc $3.99 / 6 pc $7.99 / 12 pc $15.99" never
   forces sideways scrolling on a phone. */
function priceText(item) {
  if ("price" in item) return `<span class="pp">${esc(item.price)}</span>`;
  return Object.entries(item.sizes)
    .filter(([, p]) => p !== null)
    .map(([size, p]) => `<span class="pp">${esc(size)} ${esc(p)}</span>`)
    .join('<span class="ps"> / </span>');
}

function renderTable(t) {
  const head = `<tr role="row"><th scope="col" role="columnheader">Pieces</th>${t.columns
    .map((c) => `<th scope="col" role="columnheader">${esc(c)}</th>`).join("")}</tr>`;
  const body = t.rows.map((r) => `
            <tr role="row"><th scope="row" role="rowheader">${esc(r.name)}</th>${t.columns
    .map((c) => `<td role="cell"><span class="cell-label" aria-hidden="true">${esc(c)}</span>${esc(r[c])}</td>`)
    .join("")}</tr>`).join("");
  /* Explicit roles keep this a table for screen readers on phones, where the
     CSS turns each row into a stacked card. */
  return `
        <table class="price-table" role="table">
          <thead role="rowgroup">
            ${head}
          </thead>
          <tbody role="rowgroup">${body}
          </tbody>
        </table>`;
}

function renderSection(s) {
  let inner = "";
  if (s.table) inner = renderTable(s.table);
  else if (s.chips) inner = `
        <div class="sauce-chips">
          ${s.chips.map((c) => `<span>${esc(c)}</span>`).join("")}
        </div>`;
  else inner = `
        <ul class="price-list">${s.items.map((it) => `
          <li><span class="n">${esc(it.name)}</span><span class="p">${priceText(it)}</span></li>`).join("")}
        </ul>`;
  const note = s.note ? `\n        <p class="menu-sub">${esc(s.note)}</p>` : "";
  return `
      <div class="menu-group">
        <h3>${esc(s.title)}</h3>${note}${inner}
      </div>`;
}

function renderEntry(s) {
  if (!s.group) return renderSection(s);
  return `
      <div class="menu-shared" data-group="${esc(s.group)}">${s.sections.map(renderSection).join("\n")}
        <p class="menu-sub menu-shared-note">${esc(s.note)}</p>
      </div>`;
}

function renderMenu(phone) {
  return `
    <div class="menu-board reveal">
      <div class="menu-note">${esc(MENU.orderNote)}</div>
${MENU.serviceLine ? `      <p class="menu-serve">${esc(MENU.serviceLine)}</p>\n` : ""}${MENU.sections.map(renderEntry).join("\n")}

      <p class="menu-catering">${esc(MENU.cateringNote)}</p>
      <div style="margin-top:28px">
        <a class="btn btn-gold" href="${esc(phone.href)}">Call to Order · ${esc(phone.text)}</a>
      </div>
    </div>
    `;
}

function renderPhotos() {
  if (!PHOTOS.length) return "";
  const figs = PHOTOS.map((ph) => {
    const webp = ph.webp ? `<source srcset="${esc(ph.webp)}" type="image/webp">` : "";
    return `
      <figure><picture>${webp}<img src="${esc(ph.src)}" width="${ph.width}" height="${ph.height}" loading="lazy" decoding="async" alt="${esc(ph.alt)}"></picture></figure>`;
  }).join("");
  return `
<section class="food-photos" aria-labelledby="food-photos-title">
  <div class="wrap">
    <h2 id="food-photos-title">From our kitchen</h2>
    <div class="photo-grid">${figs}
    </div>
  </div>
</section>
`;
}

/* The call button reuses the number from the contact section so the menu
   can never drift from it. */
function readPhone(html) {
  const m = html.match(/<div class="contact-card">[\s\S]*?<a href="(tel:[^"]+)">([^<]+)<\/a>/);
  if (!m) problems.push('index.html: no tel: link found in the contact card');
  return m ? { href: m[1], text: m[2].trim() } : null;
}

function replaceBetween(html, name, content) {
  const re = new RegExp(`(<!-- ${name}:BEGIN[^>]*-->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(html)) problems.push(`index.html: missing ${name}:BEGIN / ${name}:END markers`);
  /* A replacer function, not a string: in a replacement string "$1" means
     "first capture group", so a price like "$10.99" would be mangled. */
  return html.replace(re, (_, begin, end) => begin + content + end);
}

const original = readFileSync(PAGE, "utf8");
validate();
const phone = readPhone(original);
if (problems.length) {
  console.error("menu.mjs: not writing index.html\n  - " + problems.join("\n  - "));
  process.exit(1);
}

let html = replaceBetween(original, "MENU", renderMenu(phone));
html = replaceBetween(html, "PHOTOS", renderPhotos());
if (problems.length) {
  console.error("menu.mjs: not writing index.html\n  - " + problems.join("\n  - "));
  process.exit(1);
}

if (html === original) {
  console.log("menu.mjs: index.html already up to date");
} else {
  writeFileSync(PAGE, html);
  const items = flat().reduce((n, s) => n + (s.items || s.table?.rows || s.chips || []).length, 0);
  console.log(`menu.mjs: wrote ${flat().length} sections, ${items} items, ${PHOTOS.length} photos`);
}
