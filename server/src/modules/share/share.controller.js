// SHARE controllers: HTML (not JSON) pages for share links.
import { SHARE, buildPath } from "@realestate/shared";
import { env } from "../../config/env.js";
import { getVisibleListing } from "../listings/listings.service.js";
import * as shareService from "./share.service.js";

const VIEWS = ["listing", "tour"];

function sendHtml(res, status, html) {
  res
    .status(status)
    .set({
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      // Robots and people get different pages (see share.service.js), so caches must keep both
      Vary: "User-Agent",
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
    })
    .send(html);
}

// GET /share/listings/:id   (public)
// in:  query: ?view=tour (open the 3D tour instead of the listing page)
// out: 200 text/html with Open Graph / Twitter tags, then a redirect to the website
//      404 text/html if the listing doesn't exist or isn't live
export async function listing(req, res) {
  const id = Number(req.params.id);
  const view = VIEWS.includes(req.query.view) ? req.query.view : "listing";

  let found;
  try {
    if (!Number.isInteger(id) || id <= 0) throw Object.assign(new Error(), { status: 404 });
    // No viewer on purpose: only LIVE listings get a public preview, even for their owner
    found = (await getVisibleListing(id, null)).listing;
  } catch (err) {
    if (err.status === 404) return sendHtml(res, 404, shareService.renderNotFoundPage());
    throw err;
  }

  const path = buildPath(SHARE.LISTING, { id });
  const shareUrl = `${env.PUBLIC_SERVER_URL}${path}${view === "tour" ? "?view=tour" : ""}`;
  const forBot = shareService.isPreviewBot(req.get("user-agent"));
  sendHtml(res, 200, shareService.renderListingPage(found, { view, shareUrl, forBot }));
}
