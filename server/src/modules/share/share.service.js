// SHARE service: the small HTML page behind a share link (/share/listings/:id).
// Link-preview robots (WhatsApp, Viber, Messenger, Facebook...) don't run JavaScript, so the React
// app can't give each listing its own preview. This page carries the Open Graph tags they read,
// then sends real visitors on to the website.
import { LISTING_TYPE } from "@realestate/shared";
import { env } from "../../config/env.js";

const TYPE_LABEL = {
  [LISTING_TYPE.SALE]: "For sale",
  [LISTING_TYPE.RENT]: "For rent",
  [LISTING_TYPE.SHORT_STAY]: "Short stay",
};
const PRICE_SUFFIX = { [LISTING_TYPE.RENT]: " / month", [LISTING_TYPE.SHORT_STAY]: " / night" };
const NUMBER = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

// Robots that build link previews. They get the tags without the instant redirect, because some
// (Facebook) follow a meta refresh and would then read the React app's generic tags instead.
const PREVIEW_BOTS =
  /facebookexternalhit|facebot|whatsapp|viber|telegrambot|twitterbot|slackbot|linkedinbot|discordbot|pinterest|skypeuripreview|embedly|redditbot|applebot|googlebot|bingbot|vkshare|quora link preview/i;

export const isPreviewBot = (userAgent = "") => PREVIEW_BOTS.test(userAgent);

// Everything that goes into the HTML passes through here: titles and addresses are typed by
// sellers, so "<script>" in a title must stay text.
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 27500000 -> "Rs. 2,75,00,000" (+ " / month" for rent, " / night" for short stays)
export function formatPrice(price, type) {
  if (price === null || price === undefined) return "Price on request";
  return `Rs. ${NUMBER.format(Number(price))}${PRICE_SUFFIX[type] ?? ""}`;
}

// Photo paths like "/uploads/listings/5/a.jpg" live on this server; full URLs stay as they are
const absolute = (path) => (/^https?:\/\//.test(path) ? path : `${env.PUBLIC_SERVER_URL}${path}`);

// listing: a LIVE Listing (docs/API.md). view: "listing" | "tour".
// shareUrl: this page's own address (og:url, so robots don't wander off to the React app).
export function renderListingPage(listing, { view, shareUrl, forBot }) {
  const tour = view === "tour" && Boolean(listing.tourUrl);
  const target = `${env.CLIENT_URL}/listings/${listing.id}${tour ? "/tour" : ""}`;
  const price = formatPrice(listing.price, listing.type);
  const title = tour ? `${listing.title} · 3D tour` : listing.title;
  const description = [
    TYPE_LABEL[listing.type] ?? listing.type,
    listing.district,
    price,
    listing.tourUrl ? "Walk through it in 3D on Aawas" : "On Aawas",
  ].join(" · ");
  const image = listing.images?.[0] ? absolute(listing.images[0]) : null;

  const e = escapeHtml;
  const meta = [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "Aawas"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", shareUrl],
    ["property", "og:locale", "en_GB"],
    ...(image
      ? [
          ["property", "og:image", image],
          ["property", "og:image:alt", listing.title],
          ["name", "twitter:image", image],
        ]
      : []),
    ["name", "twitter:card", image ? "summary_large_image" : "summary"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "description", description],
  ]
    .map(([attr, key, value]) => `    <meta ${attr}="${key}" content="${e(value)}" />`)
    .join("\n");

  // People are sent on straight away; preview robots stay on this page (see PREVIEW_BOTS).
  // JSON.stringify + escaping "<" keeps the URL safe inside the <script>.
  const redirect = forBot
    ? ""
    : `    <meta http-equiv="refresh" content="0; url=${e(target)}" />
    <script>window.location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${e(title)} · Aawas</title>
${meta}
    <link rel="canonical" href="${e(shareUrl)}" />
${redirect}
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #faf8f3;
             font: 16px/1.5 Inter, system-ui, sans-serif; color: #16201d; }
      main { max-width: 26rem; padding: 2rem; text-align: center; }
      img { width: 100%; border-radius: 18px; aspect-ratio: 4 / 3; object-fit: cover; }
      a { display: inline-block; margin-top: 1rem; padding: .7rem 1.2rem; border-radius: 12px;
          background: #1d5b4c; color: #fff; text-decoration: none; font-weight: 600; }
      p { color: #6c7470; margin: .25rem 0; }
    </style>
  </head>
  <body>
    <main>
${image ? `      <img src="${e(image)}" alt="" />\n` : ""}      <h1>${e(title)}</h1>
      <p>${e(description)}</p>
      <a href="${e(target)}">${tour ? "Open the 3D tour" : "View this home"} on Aawas</a>
    </main>
  </body>
</html>
`;
}

export function renderNotFoundPage() {
  const home = escapeHtml(env.CLIENT_URL);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Home not found · Aawas</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #faf8f3;
             font: 16px/1.5 Inter, system-ui, sans-serif; color: #16201d; text-align: center; }
      a { color: #1d5b4c; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <h1>This home isn't available</h1>
      <p>It may have been sold, rented or taken down.</p>
      <p><a href="${home}/search">Explore other homes on Aawas</a></p>
    </main>
  </body>
</html>
`;
}
