/* eslint-disable @next/next/no-img-element */
"use client";

import {
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
  Mail,
  MousePointer2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useMemo, useState } from "react";

type TemplateMode = "single" | "multi";
type ProductStatus = "Ready" | "Needs price" | "Needs image" | "Needs terms";
type ImportState = "idle" | "loading";

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
  source: string;
  image: string;
  price: string;
  units: string;
  fob: string;
  palletQty: string;
  truckloadQty: string;
  status: ProductStatus;
  tag: string;
  summary: string;
  bullets: string[];
};

type ImportedProduct = {
  title: string;
  brand: string;
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
    source: "Amazon / Walmart link",
    image: "/products/cozzia-white.png",
    price: "$499.00",
    units: "83",
    fob: "CA / NC",
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
    source: "Walmart link",
    image: "/products/rolling-cart.png",
    price: "$8.60",
    units: "1,626",
    fob: "IL",
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
    source: "Amazon link",
    image: "/products/spin-scrubber.png",
    price: "$14.80",
    units: "1,131",
    fob: "IL",
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
    source: "Walmart link",
    image: "/products/bath-mat.png",
    price: "$4.80",
    units: "5,930",
    fob: "TX",
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
    source: "Amazon link",
    image: "/products/steamer.png",
    price: "$14.60",
    units: "1,026",
    fob: "CA",
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
    source: "Walmart link",
    image: "/products/grow-lamp.png",
    price: "$14.30",
    units: "664",
    fob: "IL",
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
    label: "Single showcase",
    description: "Option 4 style for one hero product with premium facts and buyer CTA.",
    icon: MousePointer2,
  },
  {
    id: "multi" as TemplateMode,
    label: "Catalog grid",
    description: "Option 2 style for a clean multi-product closeout email.",
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

function getProductStatus(product: ProductOffer): ProductStatus {
  if (!product.image) return "Needs image";
  if (!product.price.trim()) return "Needs price";
  if (
    !product.units.trim() ||
    !product.fob.trim() ||
    !product.palletQty.trim() ||
    !product.truckloadQty.trim()
  ) {
    return "Needs terms";
  }

  return "Ready";
}

function buildSingleEmailHtml(campaign: Campaign, product: ProductOffer) {
  const bullets = product.bullets
    .map(
      (bullet) =>
        `<li style="margin:0 0 8px;color:#24425e;font-size:15px;line-height:22px;">${escapeHtml(
          bullet,
        )}</li>`,
    )
    .join("");

  return `<!doctype html>
<html>
<body style="margin:0;background:#f3f6f8;font-family:Arial,Helvetica,sans-serif;color:#15283a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f8;padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:680px;max-width:680px;background:#ffffff;border:1px solid #dfe7ee;">
        <tr>
          <td style="background:#08263d;color:#ffffff;padding:22px 28px;">
            <div style="font-size:20px;font-weight:700;letter-spacing:.02em;">KMS Wholesale</div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9fd4ff;margin-top:6px;">Featured wholesale offer</div>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 28px 18px;">
            <div style="font-size:12px;color:#1b75bb;font-weight:700;text-transform:uppercase;">${escapeHtml(
              product.tag,
            )}</div>
            <h1 style="margin:8px 0 10px;font-size:30px;line-height:36px;color:#0d2438;">${escapeHtml(
              product.title,
            )}</h1>
            <p style="margin:0 0 20px;font-size:16px;line-height:24px;color:#46627b;">${escapeHtml(
              product.summary,
            )}</p>
            <img src="${escapeHtml(product.image)}" width="624" alt="${escapeHtml(
              product.title,
            )}" style="display:block;width:624px;max-width:100%;height:auto;border:1px solid #e3ebf1;">
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="background:#eef6fb;padding:16px;border-right:4px solid #ffffff;"><div style="font-size:12px;color:#57718a;">Wholesale price</div><div style="font-size:24px;font-weight:700;color:#0f6faa;">${escapeHtml(
                  product.price,
                )}</div></td>
                <td style="background:#eef6fb;padding:16px;border-right:4px solid #ffffff;"><div style="font-size:12px;color:#57718a;">Available units</div><div style="font-size:24px;font-weight:700;color:#14833b;">${escapeHtml(
                  product.units,
                )}</div></td>
                <td style="background:#eef6fb;padding:16px;"><div style="font-size:12px;color:#57718a;">FOB</div><div style="font-size:24px;font-weight:700;color:#0d2438;">${escapeHtml(
                  product.fob,
                )}</div></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="55%" style="vertical-align:top;padding-right:24px;">
                  <div style="font-size:16px;font-weight:700;color:#0d2438;margin-bottom:10px;">Buyer highlights</div>
                  <ul style="padding-left:20px;margin:0;">${bullets}</ul>
                </td>
                <td width="45%" style="vertical-align:top;background:#f8fafc;border:1px solid #e1e9ef;padding:16px;">
                  <div style="font-size:16px;font-weight:700;color:#0d2438;margin-bottom:12px;">Deal terms</div>
                  <div style="font-size:14px;line-height:23px;color:#24425e;">Pallet qty: <strong>${escapeHtml(
                    product.palletQty,
                  )}</strong><br>Truckload qty: <strong>${escapeHtml(
                    product.truckloadQty,
                  )}</strong><br>Timing: <strong>${escapeHtml(
                    campaign.responseBy,
                  )}</strong></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 32px;">
            <a href="mailto:sales@kmswholesale.com?subject=${encodeURIComponent(
              `Interested in ${product.title}`,
            )}" style="display:inline-block;background:#e32525;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 22px;">Reply interested</a>
            <span style="font-size:13px;color:#61768a;margin-left:12px;">Reply with target quantities or location preference.</span>
          </td>
        </tr>
        <tr><td style="background:#08263d;color:#c9d8e5;padding:20px 28px;font-size:13px;">KMS Wholesale | Buyer-ready wholesale opportunities | ${escapeHtml(
          campaign.exportTarget,
        )}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildMultiEmailHtml(campaign: Campaign, products: ProductOffer[]) {
  const productCells = products
    .map(
      (product) => `<td width="50%" style="vertical-align:top;padding:10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dfe7ee;background:#ffffff;">
          <tr><td style="padding:14px;"><img src="${escapeHtml(product.image)}" width="284" alt="${escapeHtml(
            product.title,
          )}" style="display:block;width:100%;height:auto;border:1px solid #edf2f6;"></td></tr>
          <tr><td style="padding:0 14px 14px;">
            <div style="font-size:11px;color:#1b75bb;font-weight:700;text-transform:uppercase;">${escapeHtml(
              product.brand,
            )}</div>
            <div style="font-size:18px;line-height:22px;font-weight:700;color:#0d2438;margin-top:5px;">${escapeHtml(
              product.title,
            )}</div>
            <div style="font-size:13px;line-height:19px;color:#4b657c;margin-top:8px;">${escapeHtml(
              product.bullets[0] ?? product.summary,
            )}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td style="font-size:22px;font-weight:700;color:#0f6faa;">${escapeHtml(
                  product.price,
                )}</td>
                <td align="right" style="font-size:13px;color:#14833b;font-weight:700;">In stock: ${escapeHtml(
                  product.units,
                )}</td>
              </tr>
            </table>
            <div style="font-size:12px;color:#61768a;margin-top:8px;">FOB ${escapeHtml(
              product.fob,
            )} | Pallet ${escapeHtml(product.palletQty)}</div>
          </td></tr>
        </table>
      </td>`,
    )
    .reduce<string[]>((rows, cell, index) => {
      if (index % 2 === 0) rows.push(`<tr>${cell}`);
      else rows[rows.length - 1] += `${cell}</tr>`;
      return rows;
    }, [])
    .map((row) => (row.endsWith("</tr>") ? row : `${row}<td width="50%"></td></tr>`))
    .join("");

  return `<!doctype html>
<html>
<body style="margin:0;background:#f3f6f8;font-family:Arial,Helvetica,sans-serif;color:#15283a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f8;padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="700" cellpadding="0" cellspacing="0" style="width:700px;max-width:700px;background:#ffffff;border:1px solid #dfe7ee;">
        <tr><td style="background:#08263d;color:#ffffff;padding:24px 28px;">
          <div style="font-size:20px;font-weight:700;">KMS Wholesale</div>
          <h1 style="margin:8px 0 0;font-size:30px;line-height:36px;">Houseware Closeout Deals</h1>
        </td></tr>
        <tr><td style="padding:22px 28px 6px;font-size:16px;line-height:24px;color:#46627b;">${escapeHtml(
          campaign.intro,
        )}</td></tr>
        <tr><td style="padding:10px 18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productCells}</table></td></tr>
        <tr><td style="background:#eef6fb;padding:22px 28px;color:#24425e;font-size:15px;line-height:22px;"><strong>Next step:</strong> Reply with item names and target quantities. KMS will confirm current availability, FOB details, and booking timing.</td></tr>
        <tr><td style="background:#08263d;color:#c9d8e5;padding:20px 28px;font-size:13px;">KMS Wholesale | ${escapeHtml(
          campaign.exportTarget,
        )}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default function Home() {
  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [products, setProducts] = useState<ProductOffer[]>(initialProducts);
  const [template, setTemplate] = useState<TemplateMode>("multi");
  const [selectedId, setSelectedId] = useState(initialProducts[0].id);
  const [productUrl, setProductUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importMessage, setImportMessage] = useState("");

  const activeProducts = products.filter((product) => product.active);
  const selectedProduct =
    products.find((product) => product.id === selectedId) ?? products[0];
  const singleProduct = selectedProduct ?? activeProducts[0] ?? products[0];

  const exportHtml = useMemo(() => {
    if (template === "single") return buildSingleEmailHtml(campaign, singleProduct);
    return buildMultiEmailHtml(campaign, activeProducts);
  }, [activeProducts, campaign, singleProduct, template]);

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
        source: payload.source || trimmedUrl,
        image: payload.image || "/products/product-placeholder.svg",
        price: "",
        units: "",
        fob: "",
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

  function addUploadedProduct(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = URL.createObjectURL(file);
    const nextProduct: ProductOffer = {
      id: `upload-${Date.now()}`,
      active: true,
      title: file.name.replace(/\.[^.]+$/, "").replaceAll("-", " "),
      brand: "Manual upload",
      source: "Uploaded product image / spec sheet",
      image,
      price: "",
      units: "",
      fob: "",
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
    event.target.value = "";
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(exportHtml);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadHtml() {
    const blob = new Blob([exportHtml], { type: "text/html;charset=utf-8" });
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
                  onClick={copyHtml}
                  type="button"
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copied" : "Copy HTML"}
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0f75bc] px-4 text-sm font-semibold text-white hover:bg-[#0b609c]"
                  onClick={downloadHtml}
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
                    extraction, add images or specs manually.
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
                  Upload image / spec
                  <span className="mt-1 text-xs font-normal text-[#60788e]">
                    Manual fallback
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={addUploadedProduct}
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
                        ...initialProducts[1],
                        id: nextId,
                        title: "New product offer",
                        brand: "Brand",
                        source: "Manual entry",
                        price: "",
                        units: "",
                        status: "Needs price",
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
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead className="bg-[#f7fafc] text-left text-xs uppercase tracking-[0.1em] text-[#60788e]">
                      <tr>
                        <th className="w-12 px-4 py-3">Use</th>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Units</th>
                        <th className="px-3 py-3">FOB</th>
                        <th className="px-3 py-3">Pallet qty</th>
                        <th className="px-3 py-3">Truckload qty</th>
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
                            <div className="flex items-center gap-3">
                              <img
                                alt=""
                                className="h-12 w-14 rounded-[6px] border border-[#dfe7ee] bg-white object-contain"
                                src={product.image}
                              />
                              <div className="min-w-0">
                                <input
                                  className="h-8 w-72 rounded-[6px] border border-transparent bg-transparent px-2 font-semibold text-[#102536] outline-none hover:border-[#cbd9e3] focus:border-[#0f75bc] focus:bg-white"
                                  value={product.title}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      title: event.target.value,
                                    })
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <div className="px-2 text-xs text-[#60788e]">
                                  {product.brand} · {product.source}
                                </div>
                              </div>
                            </div>
                          </td>
                          {(["price", "units", "fob", "palletQty", "truckloadQty"] as const).map(
                            (field) => (
                              <td key={field} className="px-3 py-3">
                                <input
                                  className="h-9 w-28 rounded-[6px] border border-[#d9e4ec] bg-white px-2 text-sm outline-none focus:border-[#0f75bc]"
                                  value={product[field]}
                                  onChange={(event) =>
                                    updateProduct(product.id, {
                                      [field]: event.target.value,
                                      status: event.target.value
                                        ? "Ready"
                                        : field === "price"
                                          ? "Needs price"
                                          : product.status,
                                    })
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </td>
                            ),
                          )}
                          <td className="px-3 py-3">
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
                    <SingleEmailPreview campaign={campaign} product={singleProduct} />
                  ) : (
                    <MultiEmailPreview campaign={campaign} products={activeProducts} />
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

function SingleEmailPreview({
  campaign,
  product,
}: {
  campaign: Campaign;
  product: ProductOffer;
}) {
  return (
    <div className="mx-auto w-full max-w-[390px] overflow-hidden border border-[#cdd9e3] bg-white shadow-sm">
      <div className="bg-[#08263d] px-5 py-5 text-white">
        <div className="text-lg font-bold">KMS Wholesale</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9fd4ff]">
          Featured wholesale offer
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f75bc]">
          {product.tag}
        </div>
        <h2 className="mt-2 text-2xl font-semibold leading-8 text-[#0d2438]">
          {product.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#49677f]">{product.summary}</p>
        <img
          alt=""
          className="mt-4 h-52 w-full border border-[#e3ebf1] object-contain"
          src={product.image}
        />
        <div className="mt-4 grid grid-cols-3 gap-1">
          <FactBlock label="Price" value={product.price || "Add"} tone="blue" />
          <FactBlock label="Units" value={product.units || "Add"} tone="green" />
          <FactBlock label="FOB" value={product.fob || "Add"} tone="ink" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_150px]">
          <div>
            <div className="text-sm font-semibold text-[#0d2438]">
              Buyer highlights
            </div>
            <ul className="mt-2 space-y-1.5 pl-4 text-sm leading-5 text-[#24425e]">
              {product.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
          <div className="border border-[#e1e9ef] bg-[#f8fafc] p-3 text-xs leading-5 text-[#24425e]">
            <div className="mb-1 font-semibold text-[#0d2438]">Deal terms</div>
            <div>Pallet: {product.palletQty || "Add"}</div>
            <div>Truckload: {product.truckloadQty || "Add"}</div>
            <div>Timing: {campaign.responseBy}</div>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 bg-[#e32525] px-4 py-3 text-sm font-bold text-white">
          <Mail size={15} />
          Reply interested
        </div>
      </div>
      <div className="bg-[#08263d] px-5 py-4 text-xs text-[#c9d8e5]">
        KMS Wholesale · {campaign.exportTarget}
      </div>
    </div>
  );
}

function MultiEmailPreview({
  campaign,
  products,
}: {
  campaign: Campaign;
  products: ProductOffer[];
}) {
  return (
    <div className="mx-auto w-full max-w-[390px] overflow-hidden border border-[#cdd9e3] bg-white shadow-sm">
      <div className="bg-[#08263d] px-5 py-5 text-white">
        <div className="text-lg font-bold">KMS Wholesale</div>
        <h2 className="mt-2 text-2xl font-semibold leading-7">
          Houseware Closeout Deals
        </h2>
      </div>
      <div className="px-5 py-4 text-sm leading-6 text-[#49677f]">
        {campaign.intro}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-5">
        {products.map((product) => (
          <article
            key={product.id}
            className="border border-[#dfe7ee] bg-white p-2.5"
          >
            <img
              alt=""
              className="h-28 w-full border border-[#edf2f6] object-contain"
              src={product.image}
            />
            <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0f75bc]">
              {product.brand}
            </div>
            <h3 className="mt-1 min-h-10 text-sm font-semibold leading-5 text-[#0d2438]">
              {product.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#60788e]">
              {product.bullets[0] ?? product.summary}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-base font-bold text-[#0f6faa]">
                {product.price || "Add"}
              </div>
              <div className="text-right text-[10px] font-bold text-[#14833b]">
                In stock
                <br />
                {product.units || "Add"}
              </div>
            </div>
            <div className="mt-1 text-[10px] text-[#60788e]">
              FOB {product.fob || "Add"} · Pallet {product.palletQty || "Add"}
            </div>
          </article>
        ))}
      </div>
      <div className="bg-[#eef6fb] px-5 py-4 text-sm leading-5 text-[#24425e]">
        <strong>Next step:</strong> Reply with item names and target quantities.
      </div>
      <div className="bg-[#08263d] px-5 py-4 text-xs text-[#c9d8e5]">
        KMS Wholesale · {campaign.exportTarget}
      </div>
    </div>
  );
}

function FactBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "ink";
}) {
  const toneClass =
    tone === "blue"
      ? "text-[#0f6faa]"
      : tone === "green"
        ? "text-[#14833b]"
        : "text-[#0d2438]";

  return (
    <div className="bg-[#eef6fb] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#60788e]">
        {label}
      </div>
      <div className={`mt-1 text-base font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
