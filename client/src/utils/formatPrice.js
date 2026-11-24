// Prices in Nepali style: 32500000 -> "Rs. 3,25,00,000".
// Pass the listing type to add "/ month" (rent) or "/ night" (short stay).
//   formatPrice(32500000)                       -> "Rs. 3,25,00,000"
//   formatPrice(25000, LISTING_TYPE.RENT)       -> "Rs. 25,000 / month"
//   formatPrice(4500, LISTING_TYPE.SHORT_STAY)  -> "Rs. 4,500 / night"
import { LISTING_TYPE } from "@realestate/shared";

const NUMBER_FORMAT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const SUFFIX = {
  [LISTING_TYPE.RENT]: " / month",
  [LISTING_TYPE.SHORT_STAY]: " / night",
};

export function formatPrice(price, type) {
  if (price === null || price === undefined || Number.isNaN(Number(price)))
    return "Price on request";
  return `Rs. ${NUMBER_FORMAT.format(Number(price))}${SUFFIX[type] ?? ""}`;
}

// Short labels for listing types, used on badges and tabs
export const LISTING_TYPE_LABEL = {
  [LISTING_TYPE.SALE]: "For sale",
  [LISTING_TYPE.RENT]: "For rent",
  [LISTING_TYPE.SHORT_STAY]: "Short stay",
};
