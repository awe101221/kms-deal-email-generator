/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Box,
  Check,
  ChevronRight,
  Clipboard,
  Database,
  Download,
  FileText,
  Grid3X3,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Link2,
  MousePointer2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Table2,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";

type TemplateMode = "single" | "multi";
type CatalogColumns = 1 | 2;
type ProductStatus = "Ready" | "Needs price" | "Needs image" | "Needs terms";
type ImportState = "idle" | "loading";
type ProductImageResolver = (product: ProductOffer) => string;

type Campaign = {
  subject: string;
  intro: string;
  buyer: string;
  responseBy: string;
  exportTarget: string;
};

type ProductOffer = {
  id: string;
  active: boolean;
  title: string;
  brand: string;
  modelNumber: string;
  upc: string;
  source: string;
  image: string;
  price: string;
  units: string;
  fob: string;
  casePack: string;
  palletQty: string;
  truckloadQty: string;
  status: ProductStatus;
  tag: string;
  summary: string;
  bullets: string[];
};

type ProductDetailItem = {
  label: string;
  body: string;
};

type ImportedProduct = {
  title: string;
  brand: string;
  modelNumber: string;
  upc: string;
  image: string;
  summary: string;
  bullets: string[];
  source: string;
  sourceUrl: string;
  importNote: string;
};

const initialCampaign: Campaign = {
  subject: "KMS Wholesale | Featured closeout opportunities",
  intro:
    "Below are buyer-ready wholesale opportunities available now. Reply with the items and quantities you want to review, and our team will confirm availability.",
  buyer: "Retail buyer / category manager",
  responseBy: "This week",
  exportTarget: "Outlook + Gmail compatible HTML",
};

const initialProducts: ProductOffer[] = [
  {
    id: "cozzia-chair",
    active: true,
    title: "Cozzia CZ-357 L-Track Massage Chair",
    brand: "Cozzia",
    modelNumber: "CZ-357",
    upc: "",
    source: "Amazon / Walmart link",
    image: "/products/cozzia-white.png",
    price: "$499.00",
    units: "83",
    fob: "CA / NC",
    casePack: "1",
    palletQty: "6 chairs",
    truckloadQty: "Take all by location",
    status: "Ready",
    tag: "New goods",
    summary:
      "Premium L-track massage chair with zero gravity positioning, heat therapy, and full-body recovery programs.",
    bullets: [
      "L-track massage targets neck through glutes",
      "Zero gravity recline with heat therapy",
      "Calf and foot rollers for full-body recovery",
    ],
  },
  {
    id: "rolling-cart",
    active: true,
    title: "4-Tier Rolling Cart",
    brand: "Simpli-Magic",
    modelNumber: "",
    upc: "",
    source: "Walmart link",
    image: "/products/rolling-cart.png",
    price: "$8.60",
    units: "1,626",
    fob: "IL",
    casePack: "12",
    palletQty: "72 units",
    truckloadQty: "1,728 units",
    status: "Ready",
    tag: "Closeout",
    summary: "Compact storage cart with metal baskets, wheels, and lockable casters.",
    bullets: ["4 metal baskets", "Lockable casters", "11 x 15.3 x 32 inch storage"],
  },
  {
    id: "spin-scrubber",
    active: true,
    title: "Electric Spin Scrubber Complete Kit",
    brand: "KMS Home",
    modelNumber: "",
    upc: "",
    source: "Amazon link",
    image: "/products/spin-scrubber.png",
    price: "$14.80",
    units: "1,131",
    fob: "IL",
    casePack: "24",
    palletQty: "48 units",
    truckloadQty: "1,152 units",
    status: "Ready",
    tag: "Closeout",
    summary: "Cordless cleaning kit with multiple brush heads and extendable handle.",
    bullets: ["7 brush heads", "2 speeds", "90-minute cordless runtime"],
  },
  {
    id: "bath-mat",
    active: true,
    title: "Absorbent Stone Quick-Dry Bath Mat",
    brand: "Haven",
    modelNumber: "",
    upc: "",
    source: "Walmart link",
    image: "/products/bath-mat.png",
    price: "$4.80",
    units: "5,930",
    fob: "TX",
    casePack: "20",
    palletQty: "160 units",
    truckloadQty: "4,800 units",
    status: "Ready",
    tag: "Closeout",
    summary: "Quick-dry stone bath mat with non-slip surface and compact carton profile.",
    bullets: ["Rapid-dry wicking material", "Non-slip surface", "17.75 x 13.75 inches"],
  },
  {
    id: "steamer",
    active: true,
    title: "Handheld Steamer with Stainless Nozzle",
    brand: "True & Tidy",
    modelNumber: "",
    upc: "",
    source: "Amazon link",
    image: "/products/steamer.png",
    price: "$14.60",
    units: "1,026",
    fob: "CA",
    casePack: "12",
    palletQty: "60 units",
    truckloadQty: "1,440 units",
    status: "Ready",
    tag: "Closeout",
    summary: "Portable garment steamer with soft cotton, silk, polyester, and linen use cases.",
    bullets: ["600W heating element", "Soft fabric brush", "Available in pink, teal, and sienna"],
  },
  {
    id: "grow-lamp",
    active: true,
    title: "Bionic Indoor 3-Head Grow Lamp",
    brand: "Bell + Howell",
    modelNumber: "",
    upc: "",
    source: "Walmart link",
    image: "/products/grow-lamp.png",
    price: "$14.30",
    units: "664",
    fob: "IL",
    casePack: "12",
    palletQty: "54 units",
    truckloadQty: "1,296 units",
    status: "Ready",
    tag: "Closeout",
    summary: "Indoor grow lamp with three LED heads, brightness settings, and USB power.",
    bullets: ["3 full-spectrum LED heads", "8 brightness levels", "Stand, clip, and screw mount"],
  },
];

const navItems: { label: string; icon: LucideIcon }[] = [
  { label: "Campaigns", icon: LayoutDashboard },
  { label: "Products", icon: PackageCheck },
  { label: "Templates", icon: FileText },
  { label: "Exports", icon: Inbox },
  { label: "Settings", icon: Settings },
];

const templateCards = [
  {
    id: "single" as TemplateMode,
    label: "Featured offer",
    description: "Design 2 premium product email with hero image and spec-sheet rows.",
    icon: MousePointer2,
  },
  {
    id: "multi" as TemplateMode,
    label: "Catalog grid",
    description: "Multi-product grid using the same masthead, rules, and wholesale metrics.",
    icon: Grid3X3,
  },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getProductImage(product: ProductOffer) {
  return product.image || "/products/product-placeholder.svg";
}

function getImageUrlInputValue(product: ProductOffer) {
  return product.image.startsWith("data:") ? "" : product.image;
}

function getProductIdentifierText(product: ProductOffer) {
  return [
    product.modelNumber.trim() ? `Model #: ${product.modelNumber.trim()}` : "",
    product.upc.trim() ? `UPC: ${product.upc.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildProductIdentifierHtml(product: ProductOffer) {
  const identifierText = getProductIdentifierText(product);
  if (!identifierText) return "";

  return `<div style="font-size:14px;line-height:22px;color:#6c7a8c;margin:0;">${escapeHtml(
    identifierText,
  )}</div>`;
}

function getDisplayValue(value: string, fallback = "Add") {
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function getMetricTextLength(value: string) {
  return getDisplayValue(value).replace(/\s+/g, "").length;
}

function getEmailMetricValueStyle(value: string, accent = false) {
  const textLength = getMetricTextLength(value);
  const color = accent ? "#0b5ab8" : "#132235";
  let fontSize = accent ? 27 : 24;
  let lineHeight = accent ? 32 : 29;

  if (textLength >= 7) {
    fontSize = accent ? 23 : 21;
    lineHeight = accent ? 28 : 26;
  }

  if (textLength >= 11) {
    fontSize = 17;
    lineHeight = 22;
  }

  return `margin-top:7px;font-size:${fontSize}px;line-height:${lineHeight}px;font-weight:700;color:${color};word-break:normal;overflow-wrap:normal;`;
}

function getEmailCatalogMetricValueStyle(value: string) {
  const textLength = getMetricTextLength(value);
  let fontSize = 20;
  let lineHeight = 24;

  if (textLength >= 7) {
    fontSize = 18;
    lineHeight = 22;
  }

  if (textLength >= 11) {
    fontSize = 15;
    lineHeight = 20;
  }

  return `margin-top:6px;font-size:${fontSize}px;line-height:${lineHeight}px;font-weight:700;color:#0b5ab8;word-break:normal;overflow-wrap:normal;`;
}

function getPreviewMetricValueClass(value: string, accent = false) {
  const textLength = getMetricTextLength(value);
  const colorClass = accent ? "text-[#0b5ab8]" : "text-[#132235]";

  if (textLength >= 14) {
    return `mt-2 text-[12px] font-bold leading-4 ${colorClass}`;
  }

  if (textLength >= 8) {
    return `mt-2 text-[14px] font-bold leading-[18px] ${colorClass}`;
  }

  if (textLength >= 6) {
    return `mt-2 text-[17px] font-bold leading-5 ${colorClass}`;
  }

  return `mt-2 text-[20px] font-bold leading-6 ${colorClass}`;
}

function getDetailLabelFromText(text: string) {
  const words = text
    .replace(/[^a-z0-9\s&+-]/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.slice(0, 3).join(" ") || "Product detail";
}

function getProductDetailItems(product: ProductOffer): ProductDetailItem[] {
  const detailItems: ProductDetailItem[] = [];

  if (product.summary.trim()) {
    detailItems.push({
      label: "Product overview",
      body: product.summary.trim(),
    });
  }

  product.bullets.forEach((bullet) => {
    const trimmedBullet = bullet.trim();
    if (!trimmedBullet) return;

    const dividerIndex = trimmedBullet.indexOf(":");
    if (dividerIndex > 0) {
      detailItems.push({
        label: trimmedBullet.slice(0, dividerIndex),
        body: trimmedBullet.slice(dividerIndex + 1).trim(),
      });
      return;
    }

    detailItems.push({
      label: getDetailLabelFromText(trimmedBullet),
      body: trimmedBullet,
    });
  });

  return detailItems.length > 0
    ? detailItems
    : [{ label: "Product detail", body: "Add product detail before export." }];
}

function buildProductDetailRowsHtml(product: ProductOffer) {
  return getProductDetailItems(product)
    .map((detail, index) => {
      const dividerStyle =
        index === 0 ? "" : "border-top:1px solid #d6dde6;";

      return `<tr><td style="${dividerStyle}padding:${index === 0 ? "0 0 18px" : "18px 0"};font-size:15px;line-height:24px;color:#1e3147;"><span style="font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#0b5ab8;">${escapeHtml(
        detail.label,
      )}:</span> ${escapeHtml(detail.body)}</td></tr>`;
    })
    .join("");
}

function getProductStatus(product: ProductOffer): ProductStatus {
  if (!product.image) return "Needs image";
  if (!product.price.trim()) return "Needs price";
  if (
    !product.units.trim() ||
    !product.fob.trim() ||
    !product.casePack.trim() ||
    !product.palletQty.trim() ||
    !product.truckloadQty.trim()
  ) {
    return "Needs terms";
  }

  return "Ready";
}

function buildSingleEmailHtml(
  campaign: Campaign,
  product: ProductOffer,
  resolveImage: ProductImageResolver = getProductImage,
) {
  const preheader = `${campaign.subject} | ${product.title}`;
  const detailRows = buildProductDetailRowsHtml(product);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(product.title)}</title>
</head>
<body style="margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#132235;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
    preheader,
  )}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;margin:0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;background:#ffffff;border-collapse:collapse;color:#132235;">
        <tr>
          <td style="padding:32px 44px 22px;border-bottom:1px solid #d6dde6;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-size:26px;line-height:31px;font-weight:700;color:#132235;">KMS Wholesale</td>
                <td align="right" style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6c7a8c;">FEATURED WHOLESALE OFFER</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:32px 44px 34px;">
            <img src="${escapeHtml(resolveImage(product))}" width="280" alt="${escapeHtml(
              product.title,
            )}" style="display:block;width:280px;max-width:78%;height:auto;border:0;outline:none;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:0 44px 28px;">
            <div style="font-size:11px;line-height:15px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#0b5ab8;margin:0 0 15px;">${escapeHtml(
              product.tag || "Imported",
            )}</div>
            <h1 style="margin:0 0 18px;font-size:34px;line-height:41px;font-weight:700;color:#132235;">${escapeHtml(
              product.title,
            )}</h1>
            ${buildProductIdentifierHtml(product)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #d6dde6;border-bottom:1px solid #d6dde6;">
              <tr>
                <td width="33.33%" style="padding:20px 12px 20px 0;border-right:1px solid #d6dde6;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Case Pack</div><div style="${getEmailMetricValueStyle(
                  product.casePack,
                )}">${escapeHtml(
                  getDisplayValue(product.casePack),
                )}</div></td>
                <td width="33.33%" style="padding:20px 12px;border-right:1px solid #d6dde6;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Units Per Pallet</div><div style="${getEmailMetricValueStyle(
                  product.palletQty,
                )}">${escapeHtml(
                  getDisplayValue(product.palletQty),
                )}</div></td>
                <td width="33.33%" style="padding:20px 0 20px 12px;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Units Per Truck</div><div style="${getEmailMetricValueStyle(
                  product.truckloadQty,
                )}">${escapeHtml(
                  getDisplayValue(product.truckloadQty),
                )}</div></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-bottom:1px solid #d6dde6;">
              <tr>
                <td width="33.33%" style="padding:21px 12px 21px 0;border-right:1px solid #d6dde6;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Price</div><div style="${getEmailMetricValueStyle(
                  product.price,
                  true,
                )}">${escapeHtml(
                  getDisplayValue(product.price),
                )}</div></td>
                <td width="33.33%" style="padding:21px 12px;border-right:1px solid #d6dde6;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Units</div><div style="${getEmailMetricValueStyle(
                  product.units,
                  true,
                )}">${escapeHtml(
                  getDisplayValue(product.units),
                )}</div></td>
                <td width="33.33%" style="padding:21px 0 21px 12px;"><div style="font-size:10px;line-height:14px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">FOB</div><div style="${getEmailMetricValueStyle(
                  product.fob,
                  true,
                )}">${escapeHtml(
                  getDisplayValue(product.fob),
                )}</div></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 44px 28px;">
            <div style="font-size:13px;line-height:17px;font-weight:700;letter-spacing:3.4px;text-transform:uppercase;color:#132235;">Product Detail</div>
            <div style="width:38px;height:2px;background:#0b5ab8;margin:14px 0 23px;"></div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${detailRows}
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildMultiEmailHtml(
  campaign: Campaign,
  products: ProductOffer[],
  catalogColumns: CatalogColumns,
  resolveImage: ProductImageResolver = getProductImage,
) {
  const columnWidth = catalogColumns === 1 ? "100%" : "50%";
  const productCells = products
    .map((product) => {
      const identifierText = getProductIdentifierText(product);
      const imageWidth = catalogColumns === 1 ? "220" : "150";

      return `<td width="${columnWidth}" style="vertical-align:top;padding:10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d6dde6;background:#ffffff;border-collapse:collapse;">
          <tr><td align="center" style="padding:24px 20px 18px;"><img src="${escapeHtml(resolveImage(product))}" width="${imageWidth}" alt="${escapeHtml(
            product.title,
          )}" style="display:block;width:${imageWidth}px;max-width:82%;height:auto;border:0;outline:none;text-decoration:none;"></td></tr>
          <tr><td style="padding:0 20px 20px;">
            <div style="font-size:11px;line-height:15px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#0b5ab8;">${escapeHtml(
              product.tag || product.brand,
            )}</div>
            <div style="font-size:${catalogColumns === 1 ? "22px" : "17px"};line-height:${catalogColumns === 1 ? "28px" : "22px"};font-weight:700;color:#132235;margin-top:10px;">${escapeHtml(
              product.title,
            )}</div>
            ${
              identifierText
                ? `<div style="font-size:12px;line-height:18px;color:#6c7a8c;margin-top:8px;">${escapeHtml(
                    identifierText,
                  )}</div>`
                : ""
            }
            <div style="font-size:13px;line-height:21px;color:#1e3147;margin-top:12px;">${escapeHtml(
              product.summary || product.bullets[0] || "",
            )}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #d6dde6;border-bottom:1px solid #d6dde6;margin-top:18px;">
              <tr>
                <td width="33.33%" style="padding:14px 8px 14px 0;border-right:1px solid #d6dde6;"><div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Price</div><div style="${getEmailCatalogMetricValueStyle(
                  product.price,
                )}">${escapeHtml(
                  getDisplayValue(product.price),
                )}</div></td>
                <td width="33.33%" style="padding:14px 8px;border-right:1px solid #d6dde6;"><div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">Units</div><div style="${getEmailCatalogMetricValueStyle(
                  product.units,
                )}">${escapeHtml(
                  getDisplayValue(product.units),
                )}</div></td>
                <td width="33.33%" style="padding:14px 0 14px 8px;"><div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6c7a8c;">FOB</div><div style="${getEmailCatalogMetricValueStyle(
                  product.fob,
                )}">${escapeHtml(
                  getDisplayValue(product.fob),
                )}</div></td>
              </tr>
            </table>
            <div style="font-size:11px;line-height:18px;color:#6c7a8c;margin-top:12px;text-transform:uppercase;letter-spacing:1px;">Case pack ${escapeHtml(
              getDisplayValue(product.casePack),
            )} &nbsp; | &nbsp; Pallet ${escapeHtml(
              getDisplayValue(product.palletQty),
            )} &nbsp; | &nbsp; Truck ${escapeHtml(
              getDisplayValue(product.truckloadQty),
            )}</div>
          </td></tr>
        </table>
      </td>`;
    })
    .reduce<string[]>((rows, cell, index) => {
      if (index % catalogColumns === 0) rows.push(`<tr>${cell}`);
      else rows[rows.length - 1] += `${cell}</tr>`;
      return rows;
    }, [])
    .map((row) =>
      row.endsWith("</tr>")
        ? row
        : `${row}${catalogColumns === 2 ? `<td width="${columnWidth}"></td>` : ""}</tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(campaign.subject)}</title>
</head>
<body style="margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#132235;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;margin:0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;background:#ffffff;border-collapse:collapse;color:#132235;">
        <tr>
          <td style="padding:32px 44px 22px;border-bottom:1px solid #d6dde6;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-size:26px;line-height:31px;font-weight:700;color:#132235;">KMS Wholesale</td>
                <td align="right" style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6c7a8c;">WHOLESALE CATALOG</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:34px 44px 10px;">
          <div style="font-size:11px;line-height:15px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#0b5ab8;margin:0 0 14px;">Featured offers</div>
          <h1 style="margin:0 0 14px;font-size:34px;line-height:41px;font-weight:700;color:#132235;">Houseware Closeout Deals</h1>
          <div style="font-size:15px;line-height:24px;color:#1e3147;">${escapeHtml(
          campaign.intro,
        )}</div>
        </td></tr>
        <tr><td style="padding:10px 34px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${productCells}</table></td></tr>
        <tr><td style="border-top:1px solid #d6dde6;padding:26px 44px 34px;color:#1e3147;font-size:15px;line-height:24px;"><strong style="color:#132235;">Next step:</strong> Reply with item names and target quantities. KMS will confirm availability, FOB details, and booking timing for ${escapeHtml(
          campaign.responseBy,
        )}.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default function Home() {
  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [products, setProducts] = useState<ProductOffer[]>(initialProducts);
  const [template, setTemplate] = useState<TemplateMode>("single");
  const [catalogColumns, setCatalogColumns] = useState<CatalogColumns>(1);
  const [selectedId, setSelectedId] = useState(initialProducts[0].id);
  const [productUrl, setProductUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importMessage, setImportMessage] = useState("");

  const activeProducts = products.filter((product) => product.active);
  const selectedProduct =
    products.find((product) => product.id === selectedId) ?? products[0];
  const singleProduct = selectedProduct ?? activeProducts[0] ?? products[0];

  useEffect(() => {
    const urlTemplate = new URLSearchParams(window.location.search).get("template");
    if (urlTemplate === "single" || urlTemplate === "multi") {
      const frame = window.requestAnimationFrame(() => setTemplate(urlTemplate));
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  function updateCampaign<K extends keyof Campaign>(key: K, value: Campaign[K]) {
    setCampaign((current) => ({ ...current, [key]: value }));
  }

  function updateProduct(id: string, patch: Partial<ProductOffer>) {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== id) return product;

        const nextProduct = { ...product, ...patch };
        return {
          ...nextProduct,
          status: patch.status ?? getProductStatus(nextProduct),
        };
      }),
    );
  }

  function readBlobAsDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () =>
        reject(new Error("Could not read that image file.")),
      );
      reader.readAsDataURL(blob);
    });
  }

  async function getPortableImageSrc(source: string) {
    const trimmedSource = source.trim();
    if (!trimmedSource || trimmedSource.startsWith("data:")) return trimmedSource;

    let imageUrl: URL;
    try {
      imageUrl = new URL(trimmedSource, window.location.href);
    } catch {
      return trimmedSource;
    }

    if (
      imageUrl.protocol !== "blob:" &&
      imageUrl.origin !== window.location.origin
    ) {
      return trimmedSource;
    }

    try {
      const response = await fetch(imageUrl.toString());
      if (!response.ok) return trimmedSource;

      return await readBlobAsDataUrl(await response.blob());
    } catch {
      return trimmedSource;
    }
  }

  async function buildPortableExportHtml() {
    const productsForExport =
      template === "single" ? [singleProduct] : activeProducts;
    const imageCache = new Map<string, string>();
    const imageByProductId = new Map<string, string>();

    for (const product of productsForExport) {
      const source = getProductImage(product);
      const portableSource =
        imageCache.get(source) ?? (await getPortableImageSrc(source));

      imageCache.set(source, portableSource);
      imageByProductId.set(product.id, portableSource);
    }

    const resolvePortableImage: ProductImageResolver = (product) =>
      imageByProductId.get(product.id) ?? getProductImage(product);

    if (template === "single") {
      return buildSingleEmailHtml(campaign, singleProduct, resolvePortableImage);
    }

    return buildMultiEmailHtml(
      campaign,
      activeProducts,
      catalogColumns,
      resolvePortableImage,
    );
  }

  async function replaceProductImage(
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImportMessage("Choose an image file to replace the product picture.");
      input.value = "";
      return;
    }

    try {
      const image = await readBlobAsDataUrl(file);
      updateProduct(id, { image });
      setImportMessage("Product picture updated.");
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : "Could not read that image file.",
      );
    } finally {
      input.value = "";
    }
  }

  async function addImportedProduct() {
    const trimmedUrl = productUrl.trim();
    if (!trimmedUrl) {
      setImportMessage("Paste a product URL first.");
      return;
    }

    setImportState("loading");
    setImportMessage("Analyzing product page...");

    try {
      const response = await fetch("/api/import-product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const payload = (await response.json()) as ImportedProduct & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Could not import product data.");
      }

      const nextProductBase: ProductOffer = {
        id: `imported-${Date.now()}`,
        active: true,
        title: payload.title || "Imported retail product",
        brand: payload.brand || "Retail source",
        modelNumber: payload.modelNumber || "",
        upc: payload.upc || "",
        source: payload.source || trimmedUrl,
        image: payload.image || "/products/product-placeholder.svg",
        price: "",
        units: "",
        fob: "",
        casePack: "",
        palletQty: "",
        truckloadQty: "",
        status: "Needs price",
        tag: "Imported",
        summary:
          payload.summary ||
          "Product content imported. Add wholesale terms before sending to buyers.",
        bullets:
          payload.bullets?.length > 0
            ? payload.bullets
            : ["Review imported product content", "Add wholesale terms"],
      };
      const nextProduct = {
        ...nextProductBase,
        status: getProductStatus(nextProductBase),
      };

      setProducts((current) => [nextProduct, ...current]);
      setSelectedId(nextProduct.id);
      setProductUrl("");
      setImportMessage(payload.importNote);
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? `${error.message} Use manual upload if the retailer blocks extraction.`
          : "Could not import this product. Use manual upload if the retailer blocks extraction.",
      );
    } finally {
      setImportState("idle");
    }
  }

  function importOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void addImportedProduct();
    }
  }

  async function addUploadedProduct(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImportMessage("Choose an image file for manual product upload.");
      input.value = "";
      return;
    }

    try {
      const image = await readBlobAsDataUrl(file);
      const nextProduct: ProductOffer = {
        id: `upload-${Date.now()}`,
        active: true,
        title: file.name.replace(/\.[^.]+$/, "").replaceAll("-", " "),
        brand: "Manual upload",
        modelNumber: "",
        upc: "",
        source: "Uploaded product image",
        image,
        price: "",
        units: "",
        fob: "",
        casePack: "",
        palletQty: "",
        truckloadQty: "",
        status: "Needs price",
        tag: "Manual",
        summary:
          "Manual upload added. Complete the buyer-facing description and wholesale terms.",
        bullets: ["Uploaded asset", "Add selling points", "Add wholesale terms"],
      };

      setProducts((current) => [
        { ...nextProduct, status: getProductStatus(nextProduct) },
        ...current,
      ]);
      setSelectedId(nextProduct.id);
      setImportMessage("Manual upload added. Complete the offer facts before export.");
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : "Could not read that image file.",
      );
    } finally {
      input.value = "";
    }
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(await buildPortableExportHtml());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function downloadHtml() {
    const blob = new Blob([await buildPortableExportHtml()], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      template === "single"
        ? "kms-single-product-offer.html"
        : "kms-multi-product-offer.html";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f3f6f8] text-[#102536]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[76px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#123149] bg-[#08263d] text-white xl:flex xl:flex-col">
          <div className="flex h-20 items-center justify-center border-b border-white/10">
            <div className="grid size-11 place-items-center rounded-[8px] bg-[#0f75bc] font-bold">
              KMS
            </div>
          </div>
          <nav className="flex flex-1 flex-col items-center gap-2 py-5">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`grid size-11 place-items-center rounded-[8px] transition ${
                    index === 0
                      ? "bg-[#0f75bc] text-white"
                      : "text-[#9cb5c8] hover:bg-white/10 hover:text-white"
                  }`}
                  title={item.label}
                  type="button"
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="grid size-10 place-items-center rounded-[8px] bg-white/10 text-xs font-semibold">
              DA
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-[#d9e4ec] bg-white">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between xl:px-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1b75bb]">
                  <Database size={15} />
                  KMS Wholesale Deal Studio
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#0b2133]">
                  Houseware Closeout Campaign
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#cbd9e3] bg-white px-4 text-sm font-semibold text-[#24425e] hover:bg-[#f6fafc]"
                  type="button"
                >
                  <RefreshCw size={16} />
                  Preview test
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#cbd9e3] bg-white px-4 text-sm font-semibold text-[#24425e] hover:bg-[#f6fafc]"
                  onClick={() => void copyHtml()}
                  type="button"
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copied" : "Copy HTML"}
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0f75bc] px-4 text-sm font-semibold text-white hover:bg-[#0b609c]"
                  onClick={() => void downloadHtml()}
                  type="button"
                >
                  <Download size={16} />
                  Export HTML
                </button>
              </div>
            </div>
          </header>

          <div className="grid min-w-0 flex-1 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_430px] xl:p-7">
            <section className="min-w-0 space-y-5">
              <div className="grid gap-4 rounded-[8px] border border-[#d9e4ec] bg-white p-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60788e]">
                      Campaign subject
                    </span>
                    <input
                      className="mt-2 h-11 w-full rounded-[8px] border border-[#cbd9e3] bg-white px-3 text-sm text-[#12283b] outline-none focus:border-[#0f75bc]"
                      value={campaign.subject}
                      onChange={(event) => updateCampaign("subject", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60788e]">
                      Buyer intro copy
                    </span>
                    <textarea
                      className="mt-2 min-h-24 w-full resize-none rounded-[8px] border border-[#cbd9e3] bg-white px-3 py-3 text-sm leading-6 text-[#12283b] outline-none focus:border-[#0f75bc]"
                      value={campaign.intro}
                      onChange={(event) => updateCampaign("intro", event.target.value)}
                    />
                  </label>
                </div>
                <div className="grid gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60788e]">
                      Buyer type
                    </span>
                    <input
                      className="mt-2 h-10 w-full rounded-[8px] border border-[#cbd9e3] bg-white px-3 text-sm outline-none focus:border-[#0f75bc]"
                      value={campaign.buyer}
                      onChange={(event) => updateCampaign("buyer", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60788e]">
                      Response timing
                    </span>
                    <input
                      className="mt-2 h-10 w-full rounded-[8px] border border-[#cbd9e3] bg-white px-3 text-sm outline-none focus:border-[#0f75bc]"
                      value={campaign.responseBy}
                      onChange={(event) => updateCampaign("responseBy", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60788e]">
                      Export target
                    </span>
                    <input
                      className="mt-2 h-10 w-full rounded-[8px] border border-[#cbd9e3] bg-white px-3 text-sm outline-none focus:border-[#0f75bc]"
                      value={campaign.exportTarget}
                      onChange={(event) =>
                        updateCampaign("exportTarget", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 rounded-[8px] border border-[#d9e4ec] bg-white p-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0d2438]">
                    <Search size={17} className="text-[#0f75bc]" />
                    Import from product link
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Link2
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b91a5]"
                        size={17}
                      />
                      <input
                        className="h-11 w-full rounded-[8px] border border-[#cbd9e3] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0f75bc]"
                        placeholder="Paste Walmart, Amazon, or retailer product URL"
                        value={productUrl}
                        onChange={(event) => setProductUrl(event.target.value)}
                        onKeyDown={importOnEnter}
                      />
                    </div>
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#0d2438] px-4 text-sm font-semibold text-white hover:bg-[#143755] disabled:cursor-wait disabled:bg-[#6f8495]"
                      disabled={importState === "loading"}
                      onClick={() => void addImportedProduct()}
                      type="button"
                    >
                      <Sparkles size={16} />
                      {importState === "loading" ? "Analyzing..." : "Analyze product"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#60788e]">
                    Public product pages can be imported when available. If a marketplace blocks
                    extraction, add an image manually.
                  </p>
                  {importMessage ? (
                    <p
                      className={`mt-2 rounded-[8px] px-3 py-2 text-xs leading-5 ${
                        importMessage.includes("Could not") ||
                        importMessage.includes("Paste a product")
                          ? "bg-[#fdeaea] text-[#8d2525]"
                          : "bg-[#eef6fb] text-[#24425e]"
                      }`}
                    >
                      {importMessage}
                    </p>
                  ) : null}
                </div>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#b7cad8] bg-[#f8fbfd] px-5 text-center text-sm font-semibold text-[#24425e] hover:border-[#0f75bc]">
                  <ImagePlus size={22} className="mb-2 text-[#0f75bc]" />
                  Upload image
                  <span className="mt-1 text-xs font-normal text-[#60788e]">
                    Manual product row
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => void addUploadedProduct(event)}
                  />
                </label>
              </div>

              <div className="overflow-hidden rounded-[8px] border border-[#d9e4ec] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#e1e9ef] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#0d2438]">
                      Product offer table
                    </h2>
                    <p className="mt-1 text-sm text-[#60788e]">
                      Edit wholesale facts directly. Active rows flow into the email preview.
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#cbd9e3] px-3 text-sm font-semibold text-[#24425e] hover:bg-[#f6fafc]"
                    onClick={() => {
                      const nextId = `blank-${Date.now()}`;
                      const nextProduct: ProductOffer = {
                        id: nextId,
                        active: true,
                        title: "New product offer",
                        brand: "Brand",
                        modelNumber: "",
                        upc: "",
                        source: "Manual entry",
                        image: "/products/product-placeholder.svg",
                        price: "",
                        units: "",
                        fob: "",
                        casePack: "",
                        palletQty: "",
                        truckloadQty: "",
                        status: "Needs price",
                        tag: "Manual",
                        summary: "Add a buyer-facing product description.",
                        bullets: ["Add buyer highlights"],
                      };
                      setProducts((current) => [
                        { ...nextProduct, status: getProductStatus(nextProduct) },
                        ...current,
                      ]);
                      setSelectedId(nextId);
                    }}
                    type="button"
                  >
                    <Plus size={16} />
                    Add row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1580px] border-collapse text-sm">
                    <thead className="bg-[#f7fafc] text-left text-xs uppercase tracking-[0.1em] text-[#60788e]">
                      <tr>
                        <th className="w-12 px-4 py-3">Use</th>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3">Model #</th>
                        <th className="px-3 py-3">UPC</th>
                        <th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Units</th>
                        <th className="px-3 py-3">FOB</th>
                        <th className="px-3 py-3">Case pack</th>
                        <th className="px-3 py-3">Units / pallet</th>
                        <th className="px-3 py-3">Units / truck</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className={`border-t border-[#edf2f6] ${
                            selectedId === product.id ? "bg-[#eef6fb]" : "bg-white"
                          }`}
                          onClick={() => setSelectedId(product.id)}
                        >
                          <td className="px-4 py-3 align-middle">
                            <input
                              checked={product.active}
                              className="size-4 accent-[#0f75bc]"
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  active: event.target.checked,
                                })
                              }
                              onClick={(event) => event.stopPropagation()}
                              type="checkbox"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-start gap-3">
                              <label
                                className="group relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[6px] border border-[#dfe7ee] bg-white"
                                onClick={(event) => event.stopPropagation()}
                                title="Change product picture"
                              >
                                <img
                                  alt=""
                                  className="h-full w-full object-contain"
                                  src={getProductImage(product)}
                                />
                                <span className="absolute inset-x-0 bottom-0 inline-flex items-center justify-center gap-1 bg-[#08263d]/85 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                  <ImagePlus size={12} />
                                  Change
                                </span>
                                <input
                                  className="hidden"
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    void replaceProductImage(product.id, event)
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </label>
                              <div className="min-w-0 flex-1 space-y-2">
                                <textarea
                                  aria-label={`${product.title} title`}
                                  className="min-h-8 w-full resize-y overflow-hidden rounded-[6px] border border-transparent bg-transparent px-2 py-1.5 font-semibold leading-5 text-[#102536] outline-none transition-[min-height,box-shadow] hover:border-[#cbd9e3] focus:min-h-24 focus:border-[#0f75bc] focus:bg-white focus:shadow-[0_8px_20px_rgba(15,117,188,0.12)]"
                                  rows={1}
                                  value={product.title}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      title: event.target.value,
                                    })
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.preventDefault();
                                  }}
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <input
                                  aria-label={`${product.title} brand`}
                                  className="h-8 w-full rounded-[6px] border border-[#d9e4ec] bg-white px-2 text-xs font-semibold text-[#24425e] outline-none focus:border-[#0f75bc]"
                                  placeholder="Brand"
                                  value={product.brand}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      brand: event.target.value,
                                    })
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <input
                                  aria-label={`${product.title} image URL`}
                                  className="h-8 w-full rounded-[6px] border border-[#d9e4ec] bg-white px-2 text-xs text-[#24425e] outline-none focus:border-[#0f75bc]"
                                  placeholder={
                                    product.image.startsWith("data:")
                                      ? "Uploaded image in use; paste image URL to replace"
                                      : "Image URL"
                                  }
                                  value={getImageUrlInputValue(product)}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      image: event.target.value.trim(),
                                    })
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <textarea
                                  aria-label={`${product.title} product description`}
                                  className="min-h-14 w-full resize-y overflow-hidden rounded-[6px] border border-[#d9e4ec] bg-white px-2 py-2 text-xs leading-5 text-[#24425e] outline-none transition-[min-height,box-shadow] focus:min-h-40 focus:overflow-auto focus:border-[#0f75bc] focus:shadow-[0_8px_20px_rgba(15,117,188,0.12)]"
                                  placeholder="Product description"
                                  value={product.summary}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      summary: event.target.value,
                                    })
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </div>
                            </div>
                          </td>
                          {(["modelNumber", "upc"] as const).map((field) => (
                            <td key={field} className="px-3 py-3 align-top">
                              <input
                                className="h-9 w-32 rounded-[6px] border border-[#d9e4ec] bg-white px-2 text-sm outline-none focus:border-[#0f75bc]"
                                placeholder={field === "modelNumber" ? "Model #" : "UPC"}
                                value={product[field]}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    [field]: event.target.value,
                                  })
                                }
                                onClick={(event) => event.stopPropagation()}
                              />
                            </td>
                          ))}
                          {(
                            [
                              "price",
                              "units",
                              "fob",
                              "casePack",
                              "palletQty",
                              "truckloadQty",
                            ] as const
                          ).map((field) => (
                            <td key={field} className="px-3 py-3 align-top">
                              <input
                                className="h-9 w-28 rounded-[6px] border border-[#d9e4ec] bg-white px-2 text-sm outline-none focus:border-[#0f75bc]"
                                value={product[field]}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    [field]: event.target.value,
                                  })
                                }
                                onClick={(event) => event.stopPropagation()}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-3 align-top">
                            <span
                              className={`inline-flex rounded-[999px] px-2.5 py-1 text-xs font-semibold ${
                                product.status === "Ready"
                                  ? "bg-[#e8f7ee] text-[#137a39]"
                                  : product.status === "Needs image"
                                    ? "bg-[#fff3dc] text-[#9a6407]"
                                    : product.status === "Needs terms"
                                      ? "bg-[#fff3dc] text-[#9a6407]"
                                      : "bg-[#fdeaea] text-[#a12929]"
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#d9e4ec] bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0d2438]">
                  <Table2 size={17} className="text-[#0f75bc]" />
                  Template style
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {templateCards.map((card) => {
                    const Icon = card.icon;
                    const active = template === card.id;
                    return (
                      <button
                        key={card.id}
                        className={`flex items-start gap-3 rounded-[8px] border p-4 text-left transition ${
                          active
                            ? "border-[#0f75bc] bg-[#eef6fb]"
                            : "border-[#d9e4ec] bg-white hover:bg-[#f8fbfd]"
                        }`}
                        onClick={() => setTemplate(card.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            setTemplate(card.id);
                          }
                        }}
                        onMouseDown={() => setTemplate(card.id)}
                        type="button"
                      >
                        <span
                          className={`grid size-10 shrink-0 place-items-center rounded-[8px] ${
                            active
                              ? "bg-[#0f75bc] text-white"
                              : "bg-[#edf3f7] text-[#24425e]"
                          }`}
                        >
                          <Icon size={19} />
                        </span>
                        <span>
                          <span className="block font-semibold text-[#0d2438]">
                            {card.label}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-[#60788e]">
                            {card.description}
                          </span>
                        </span>
                        <ChevronRight
                          className="ml-auto mt-2 text-[#8aa0b3]"
                          size={17}
                        />
                      </button>
                    );
                  })}
                </div>
                {template === "multi" ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#d9e4ec] bg-[#f8fbfd] p-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0d2438]">
                        Catalog row layout
                      </div>
                    </div>
                    <div className="inline-flex rounded-[8px] border border-[#cbd9e3] bg-white p-1">
                      {([1, 2] as const).map((columns) => (
                        <button
                          key={columns}
                          className={`h-8 rounded-[6px] px-3 text-xs font-semibold transition ${
                            catalogColumns === columns
                              ? "bg-[#0f75bc] text-white"
                              : "text-[#24425e] hover:bg-[#eef6fb]"
                          }`}
                          onClick={() => setCatalogColumns(columns)}
                          type="button"
                        >
                          {columns} per row
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="min-w-0">
              <div className="sticky top-5 overflow-hidden rounded-[8px] border border-[#d9e4ec] bg-white">
                <div className="flex items-center justify-between border-b border-[#e1e9ef] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[#0d2438]">
                      Live email preview
                    </div>
                    <div className="text-xs text-[#60788e]">
                      {template === "single"
                        ? "Single product showcase"
                        : `${activeProducts.length} active products`}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-[999px] bg-[#e8f7ee] px-2.5 py-1 text-xs font-semibold text-[#137a39]">
                    <Check size={13} />
                    Provider neutral
                  </span>
                </div>
                <div className="max-h-[calc(100vh-130px)] overflow-y-auto bg-[#e9eff4] p-4">
                  {template === "single" ? (
                    <SingleEmailPreview product={singleProduct} />
                  ) : (
                    <MultiEmailPreview
                      campaign={campaign}
                      catalogColumns={catalogColumns}
                      products={activeProducts}
                    />
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function SingleEmailPreview({ product }: { product: ProductOffer }) {
  const detailItems = getProductDetailItems(product);

  return (
    <div className="mx-auto w-full max-w-[390px] overflow-hidden border border-[#d6dde6] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#d6dde6] px-5 py-4">
        <div className="text-lg font-bold text-[#132235]">KMS Wholesale</div>
        <div className="shrink-0 text-right text-[8px] font-bold uppercase leading-[11px] tracking-[0.22em] text-[#6c7a8c]">
          Featured
          <br />
          wholesale offer
        </div>
      </div>
      <div className="flex justify-center px-5 pb-7 pt-6">
        <img
          alt=""
          className="h-56 w-full max-w-[220px] object-contain"
          src={getProductImage(product)}
        />
      </div>
      <div className="px-5 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#0b5ab8]">
          {product.tag || "Imported"}
        </div>
        <h2 className="mt-3 text-[23px] font-bold leading-[1.18] text-[#132235]">
          {product.title}
        </h2>
        {getProductIdentifierText(product) ? (
          <div className="mt-3 text-xs leading-5 text-[#6c7a8c]">
            {getProductIdentifierText(product)}
          </div>
        ) : null}
      </div>
      <EmailSpecRow
        items={[
          {
            icon: Box,
            label: "Case Pack",
            value: getDisplayValue(product.casePack),
          },
          {
            icon: Grid3X3,
            label: "Pallet",
            value: getDisplayValue(product.palletQty),
          },
          {
            icon: Truck,
            label: "Truckload",
            value: getDisplayValue(product.truckloadQty),
          },
        ]}
      />
      <EmailSpecRow
        accent
        items={[
          { label: "Price", value: getDisplayValue(product.price) },
          { label: "Units", value: getDisplayValue(product.units) },
          { label: "FOB", value: getDisplayValue(product.fob) },
        ]}
      />
      <div className="px-5 py-6">
        <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#132235]">
          Product Detail
        </div>
        <div className="mt-3 h-0.5 w-9 bg-[#0b5ab8]" />
        <div className="mt-5">
          {detailItems.map((detail, index) => (
            <p
              key={`${detail.label}-${index}`}
              className={`m-0 text-[13px] leading-[22px] text-[#1e3147] ${
                index === 0 ? "" : "border-t border-[#d6dde6] pt-4"
              } ${index === detailItems.length - 1 ? "" : "pb-4"}`}
            >
              <span className="font-bold uppercase tracking-normal text-[#0b5ab8]">
                {detail.label}:
              </span>{" "}
              {detail.body}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailSpecRow({
  accent,
  items,
}: {
  accent?: boolean;
  items: { icon?: LucideIcon; label: string; value: string }[];
}) {
  return (
    <div className="mx-5 grid grid-cols-3 border-y border-[#d6dde6]">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`min-w-0 px-2.5 py-4 ${
              index === 0 ? "" : "border-l border-[#d6dde6]"
            }`}
          >
            {Icon ? <Icon className="mb-2.5 text-[#132235]" size={17} /> : null}
            <div className="text-[8px] font-bold uppercase leading-[11px] tracking-[0.08em] text-[#6c7a8c]">
              {item.label}
            </div>
            <div
              className={getPreviewMetricValueClass(item.value, accent)}
            >
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatalogMetricStrip({ product }: { product: ProductOffer }) {
  return (
    <div className="mt-4 grid grid-cols-3 border-y border-[#d6dde6]">
      {[
        ["Price", getDisplayValue(product.price)],
        ["Units", getDisplayValue(product.units)],
        ["FOB", getDisplayValue(product.fob)],
      ].map(([label, value], index) => (
        <div
          key={label}
          className={`min-w-0 px-2 py-3 ${
            index === 0 ? "" : "border-l border-[#d6dde6]"
          }`}
        >
          <div className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#6c7a8c]">
            {label}
          </div>
          <div className={getPreviewMetricValueClass(value, true)}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogLogisticsLine({ product }: { product: ProductOffer }) {
  return (
    <div className="mt-3 text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#6c7a8c]">
      Case {getDisplayValue(product.casePack)} | Pallet{" "}
      {getDisplayValue(product.palletQty)} | Truck{" "}
      {getDisplayValue(product.truckloadQty)}
    </div>
  );
}

function MultiEmailPreview({
  campaign,
  catalogColumns,
  products,
}: {
  campaign: Campaign;
  catalogColumns: CatalogColumns;
  products: ProductOffer[];
}) {
  return (
    <div className="mx-auto w-full max-w-[390px] overflow-hidden border border-[#d6dde6] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#d6dde6] px-5 py-4">
        <div className="text-lg font-bold text-[#132235]">KMS Wholesale</div>
        <div className="shrink-0 text-right text-[8px] font-bold uppercase leading-[11px] tracking-[0.22em] text-[#6c7a8c]">
          Wholesale
          <br />
          catalog
        </div>
      </div>
      <div className="px-5 pb-4 pt-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#0b5ab8]">
          Featured offers
        </div>
        <h2 className="mt-3 text-[24px] font-bold leading-[1.18] text-[#132235]">
          Houseware Closeout Deals
        </h2>
        <p className="mt-3 text-[13px] leading-[22px] text-[#1e3147]">
          {campaign.intro}
        </p>
      </div>
      <div
        className={`grid gap-3 px-4 pb-6 ${
          catalogColumns === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {products.map((product) => (
          <article
            key={product.id}
            className="border border-[#d6dde6] bg-white p-4"
          >
            <div className="flex justify-center pb-4 pt-2">
              <img
                alt=""
                className={`w-full object-contain ${
                  catalogColumns === 1 ? "h-44 max-w-[220px]" : "h-28"
                }`}
                src={getProductImage(product)}
              />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b5ab8]">
              {product.tag || product.brand}
            </div>
            <h3
              className={`mt-2 font-bold text-[#132235] ${
                catalogColumns === 1
                  ? "text-lg leading-6"
                  : "text-sm leading-5"
              }`}
            >
              {product.title}
            </h3>
            {getProductIdentifierText(product) ? (
              <div className="mt-2 text-[10px] leading-4 text-[#6c7a8c]">
                {getProductIdentifierText(product)}
              </div>
            ) : null}
            <p
              className={`mt-3 text-[#1e3147] ${
                catalogColumns === 1
                  ? "text-[13px] leading-[22px]"
                  : "line-clamp-3 text-xs leading-5"
              }`}
            >
              {product.summary || product.bullets[0]}
            </p>
            <CatalogMetricStrip product={product} />
            <CatalogLogisticsLine product={product} />
          </article>
        ))}
      </div>
      <div className="border-t border-[#d6dde6] px-5 py-5 text-[13px] leading-[22px] text-[#1e3147]">
        <strong className="text-[#132235]">Next step:</strong> Reply with item
        names and target quantities.
      </div>
    </div>
  );
}
