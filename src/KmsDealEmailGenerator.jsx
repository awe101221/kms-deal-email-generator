import React, { useState, useRef, useCallback } from 'react';

// ─── KMS.deals Brand Constants ───────────────────────────────────────────────
const BRAND = {
  navy: '#1B2A4A',
  blue: '#2B7DE9',
  lightBlueBg: '#EBF3FE',
  outerBg: '#F0F1F4',
  cardBg: '#FFFFFF',
  lightBg: '#F7F8FA',
  textMid: '#5A6578',
  textLight: '#9BA3B2',
  textMuted: '#C8CDD6',
  green: '#00B37E',
  greenBg: '#EDFDF6',
  amber: '#D97706',
  border: '#E5E8EE',
  dashedBorder: '#D0D5DD',
};

const FONT = {
  inter: "'Inter','Helvetica Neue',Arial,sans-serif",
  mono: "'JetBrains Mono',monospace",
};

// ─── CSV Parsing ─────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function normalizeProduct(raw) {
  return {
    brand: raw.brand || '',
    title: raw.title || raw.product_title || raw.name || raw.product_name || '',
    category: raw.category || raw.cat || '',
    msrp: raw.msrp || raw.retail_price || raw.retail || '',
    cost: raw.cost || raw.wholesale_cost || raw.price || raw.wholesale_price || '',
    qty: raw.qty || raw.quantity || raw.units || raw.available || '',
    status: raw.status || raw.stock_status || raw.availability || 'In Stock',
    image_url: raw.image_url || raw.image || raw.img || raw.photo || '',
    match_tags: raw.match_tags || raw.tags || raw.match || '',
  };
}

// ─── Email HTML Generator ────────────────────────────────────────────────────
function generateEmailHTML(products, config) {
  const { categories, date, featuredCount } = config;
  const featured = products.slice(0, featuredCount);
  const listed = products.slice(featuredCount);

  const fmtPrice = (v) => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
  };
  const fmtQty = (v) => {
    const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? '0' : n.toLocaleString();
  };
  const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const catTags = categories.slice(0, 4).map(c =>
    `<span style="display:inline-block;font-family:${FONT.inter};font-size:10px;font-weight:500;color:${BRAND.navy};background-color:${BRAND.lightBg};border:1px solid ${BRAND.border};padding:3px 9px;border-radius:3px;margin:0 3px;">${c}</span>`
  ).join('');
  const extraCats = categories.length > 4
    ? `<span style="display:inline-block;font-family:${FONT.inter};font-size:10px;font-weight:500;color:${BRAND.textLight};background-color:#FFFFFF;border:1px dashed ${BRAND.dashedBorder};padding:3px 9px;border-radius:3px;margin:0 3px;">+${categories.length - 4} more</span>`
    : '';

  const statusTag = (status) => {
    const s = status.toLowerCase();
    if (s === 'network') return `<span style="font-family:${FONT.inter};font-size:9px;font-weight:600;color:${BRAND.amber};background-color:#FEF3C7;padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;">Network</span>`;
    return `<span style="font-family:${FONT.inter};font-size:9px;font-weight:600;color:${BRAND.green};background-color:${BRAND.greenBg};padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;">In Stock</span>`;
  };

  const dealCard = (p) => `
        <tr><td style="padding:8px 32px 0 32px;" class="mobile-padding">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
            <tr>
              ${p.image_url ? `<td width="120" style="vertical-align:top;background-color:#FFFFFF;" class="stack-column">
                <img src="${p.image_url}" width="120" height="140" alt="${p.title}" style="display:block;object-fit:contain;padding:6px;" class="fluid">
              </td>` : ''}
              <td style="vertical-align:top;padding:14px 16px;" class="stack-column">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:6px;"><tr>
                  <td style="padding-right:5px;"><span style="font-family:${FONT.inter};font-size:9px;font-weight:600;color:${BRAND.blue};background-color:${BRAND.lightBlueBg};padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;">${p.category}</span></td>
                  <td>${statusTag(p.status)}</td>
                </tr></table>
                <p style="margin:0 0 1px 0;font-family:${FONT.inter};font-size:10px;font-weight:500;color:${BRAND.textLight};letter-spacing:0.3px;">${p.brand}</p>
                <p style="margin:0 0 8px 0;font-family:${FONT.inter};font-size:14px;font-weight:600;color:${BRAND.navy};line-height:1.3;">${p.title}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:8px;"><tr>
                  <td style="padding-right:16px;">
                    <p style="margin:0;font-family:${FONT.inter};font-size:9px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;">MSRP</p>
                    <p style="margin:1px 0 0 0;font-family:${FONT.mono};font-size:12px;color:${BRAND.textMuted};text-decoration:line-through;">${fmtPrice(p.msrp)}</p>
                  </td>
                  ${p.status.toLowerCase() !== 'network' ? `
                  <td style="padding-right:16px;">
                    <p style="margin:0;font-family:${FONT.inter};font-size:9px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;">Cost</p>
                    <p style="margin:1px 0 0 0;font-family:${FONT.mono};font-size:12px;font-weight:500;color:${BRAND.navy};">${fmtPrice(p.cost)}</p>
                  </td>` : `
                  <td style="padding-right:16px;">
                    <p style="margin:0;font-family:${FONT.inter};font-size:9px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;">Cost</p>
                    <p style="margin:1px 0 0 0;font-family:${FONT.mono};font-size:12px;font-weight:500;color:${BRAND.amber};">On request</p>
                  </td>`}
                  <td>
                    <p style="margin:0;font-family:${FONT.inter};font-size:9px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;">Qty</p>
                    <p style="margin:1px 0 0 0;font-family:${FONT.mono};font-size:12px;color:${BRAND.navy};">${fmtQty(p.qty)}</p>
                  </td>
                </tr></table>
                ${p.match_tags ? `<p style="margin:0;font-family:${FONT.mono};font-size:9px;color:${BRAND.textMuted};letter-spacing:0.2px;">match: ${p.match_tags.split(',').map(t => t.trim()).join(' · ')}</p>` : ''}
              </td>
            </tr>
          </table>
        </td></tr>`;

  const listItem = (p, isLast) => `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px solid ${BRAND.border};${isLast ? `border-bottom:1px solid ${BRAND.border};` : ''}">
            <tr><td style="padding:10px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-family:${FONT.inter};font-size:13px;font-weight:600;color:${BRAND.navy};">${p.title}</p>
                  <p style="margin:2px 0 0 0;font-family:${FONT.inter};font-size:11px;color:${BRAND.textLight};">${p.brand} &middot; ${p.category} &middot; ${fmtQty(p.qty)} units${p.status.toLowerCase() === 'network' ? ' &middot; Network' : ''}</p>
                </td>
                <td style="text-align:right;vertical-align:middle;white-space:nowrap;" class="hide-mobile">
                  ${p.status.toLowerCase() === 'network'
                    ? `<span style="font-family:${FONT.mono};font-size:11px;color:${BRAND.amber};font-weight:500;">On request</span>`
                    : `<span style="font-family:${FONT.mono};font-size:11px;color:${BRAND.textMuted};text-decoration:line-through;">${fmtPrice(p.msrp)}</span>
                       <span style="font-family:${FONT.mono};font-size:11px;color:${BRAND.navy};font-weight:500;padding-left:6px;">${fmtPrice(p.cost)}</span>`}
                </td>
              </tr></table>
            </td></tr>
          </table>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>KMS.deals</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;width:100%!important;height:100%!important}
    @media screen and (max-width:640px){
      .email-container{width:100%!important}
      .fluid{max-width:100%!important;height:auto!important}
      .stack-column{display:block!important;width:100%!important;max-width:100%!important}
      .mobile-padding{padding-left:20px!important;padding-right:20px!important}
      .hide-mobile{display:none!important}
    }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.outerBg};font-family:${FONT.inter};">

  <div style="display:none;font-size:1px;color:${BRAND.outerBg};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${products.length} new item${products.length !== 1 ? 's' : ''} matched your profile this week.
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.outerBg};">
    <tr><td align="center" style="padding:28px 12px;">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" class="email-container" style="max-width:580px;margin:auto;background-color:#FFFFFF;border-radius:10px;overflow:hidden;border:1px solid ${BRAND.border};">

        <!-- ACCENT -->
        <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.navy} 0%,${BRAND.blue} 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- HEADER -->
        <tr><td style="padding:24px 32px 0 32px;" class="mobile-padding">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:18px;">
            <tr>
              <td style="vertical-align:baseline;">
                <span style="font-family:${FONT.inter};font-size:20px;line-height:1;letter-spacing:-1.2px;font-weight:800;color:${BRAND.navy};">KMS</span><span style="font-family:${FONT.inter};font-size:20px;line-height:1;letter-spacing:-1.2px;font-weight:800;color:${BRAND.navy};">.</span><span style="font-family:${FONT.inter};font-size:20px;line-height:1;letter-spacing:-1.2px;font-weight:300;color:${BRAND.blue};">deals</span>
              </td>
              <td style="text-align:right;vertical-align:baseline;">
                <span style="font-family:${FONT.mono};font-size:11px;color:${BRAND.textLight};">${fmtDate(date)}</span>
              </td>
            </tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-family:${FONT.inter};font-size:11px;font-weight:500;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.8px;margin-right:10px;">Matching on</span>
                ${catTags}${extraCats}
              </td>
              <td style="text-align:right;vertical-align:middle;white-space:nowrap;" class="hide-mobile">
                <a href="#" style="font-family:${FONT.inter};font-size:11px;font-weight:500;color:${BRAND.blue};text-decoration:none;">Edit</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- DIVIDER -->
        <tr><td style="padding:16px 32px 0 32px;" class="mobile-padding"><div style="height:1px;background-color:${BRAND.border};"></div></td></tr>

        <!-- FEATURED CARDS -->
${featured.map(p => dealCard(p)).join('\n')}

        ${listed.length > 0 ? `
        <!-- ALSO AVAILABLE -->
        <tr><td style="padding:18px 32px 0 32px;" class="mobile-padding">
          <p style="margin:0 0 10px 0;font-family:${FONT.inter};font-size:10px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:1.2px;">Also available</p>
${listed.map((p, i) => listItem(p, i === listed.length - 1)).join('\n')}
        </td></tr>` : ''}

        <!-- PROFILE NUDGE -->
        <tr><td style="padding:18px 32px 0 32px;" class="mobile-padding">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.lightBg};border-radius:6px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0 0 4px 0;font-family:${FONT.inter};font-size:12px;font-weight:600;color:${BRAND.navy};">Sharpen your results</p>
              <p style="margin:0 0 10px 0;font-family:${FONT.inter};font-size:12px;color:${BRAND.textMid};line-height:1.5;">Add category tags, preferred brands, price ranges, and minimum quantities to surface more relevant inventory.</p>
              <a href="#" style="font-family:${FONT.inter};font-size:12px;font-weight:600;color:${BRAND.blue};text-decoration:none;">Update your profile &rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:20px 32px 20px 32px;text-align:center;" class="mobile-padding">
          <p style="margin:0 0 12px 0;font-family:${FONT.inter};font-size:13px;color:${BRAND.textMid};line-height:1.5;">
            If anything here works for you, reply to this email.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
            <td style="background-color:${BRAND.navy};border-radius:5px;">
              <a href="https://catalog.kmswholesale.com" target="_blank" style="display:inline-block;padding:10px 22px;font-family:${FONT.inter};font-size:12px;font-weight:600;color:#FFFFFF;text-decoration:none;">View full catalog</a>
            </td>
          </tr></table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding:16px 32px 20px 32px;border-top:1px solid ${BRAND.border};" class="mobile-padding">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
            <td>
              <p style="margin:0;font-family:${FONT.inter};font-size:11px;font-weight:600;color:${BRAND.navy};">KMS, LLC</p>
              <p style="margin:2px 0 0 0;font-family:${FONT.inter};font-size:11px;color:${BRAND.textLight};">Wichita, Kansas &middot; (800) 752-5262</p>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <a href="https://kmswholesale.com" style="font-family:${FONT.inter};font-size:10px;color:${BRAND.textMid};text-decoration:none;">Website</a>
              <span style="color:${BRAND.textMuted};font-size:10px;"> &middot; </span>
              <a href="#" style="font-family:${FONT.inter};font-size:10px;color:${BRAND.textLight};text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr></table>
          <p style="margin:10px 0 0 0;font-family:${FONT.inter};font-size:10px;color:${BRAND.textMuted};text-align:center;">
            Items based on your profile. Subject to availability. &copy; ${new Date().getFullYear()} KMS, LLC.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: FONT.inter },
  header: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 },
  logoKms: { fontSize: 28, fontWeight: 800, color: BRAND.navy, letterSpacing: -1.2 },
  logoDot: { fontSize: 28, fontWeight: 800, color: BRAND.navy, letterSpacing: -1.2 },
  logoDeals: { fontSize: 28, fontWeight: 300, color: BRAND.blue, letterSpacing: -1.2 },
  subtitle: { fontSize: 13, color: BRAND.textMid, marginBottom: 28 },
  card: { background: '#fff', borderRadius: 10, border: `1px solid ${BRAND.border}`, padding: 24, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 600, color: BRAND.textLight, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  input: { width: '100%', padding: '8px 12px', border: `1px solid ${BRAND.border}`, borderRadius: 6, fontSize: 13, fontFamily: FONT.inter, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: `1px solid ${BRAND.border}`, borderRadius: 6, fontSize: 12, fontFamily: FONT.mono, minHeight: 140, resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  btn: { padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT.inter },
  btnPrimary: { background: BRAND.navy, color: '#fff' },
  btnSecondary: { background: BRAND.lightBg, color: BRAND.navy, border: `1px solid ${BRAND.border}` },
  btnSuccess: { background: BRAND.green, color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', background: BRAND.lightBg, color: BRAND.textLight, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${BRAND.border}` },
  td: { padding: '8px 10px', borderBottom: `1px solid ${BRAND.border}`, color: BRAND.navy, verticalAlign: 'top' },
  tdInput: { width: '100%', padding: '4px 6px', border: `1px solid ${BRAND.border}`, borderRadius: 4, fontSize: 12, fontFamily: FONT.inter, outline: 'none', boxSizing: 'border-box' },
  tag: { display: 'inline-block', fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 3, marginRight: 4, marginBottom: 4 },
  tagCat: { background: BRAND.lightBlueBg, color: BRAND.blue },
  tagStock: { background: BRAND.greenBg, color: BRAND.green },
  tagNetwork: { background: '#FEF3C7', color: BRAND.amber },
  step: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700, marginRight: 10 },
  stepActive: { background: BRAND.navy, color: '#fff' },
  stepDone: { background: BRAND.green, color: '#fff' },
  stepPending: { background: BRAND.lightBg, color: BRAND.textLight, border: `1px solid ${BRAND.border}` },
};

// ─── Sample CSV ──────────────────────────────────────────────────────────────
const SAMPLE_CSV = `brand,title,category,msrp,cost,qty,status,image_url,match_tags
Enbrighten,Flameless LED Candles 3-Pack w/ Remote,Lighting,24.99,8.50,2400,In Stock,,lighting,seasonal decor,retail-ready
Bonaire,Durango Duet 300 CFM Portable Evaporative Cooler,Cooling,115.38,42.00,3600,In Stock,,cooling,seasonal,appliances
Warm Living,Infrared Heater 1500W,Heating,89.99,31.00,4200,In Stock,,heating,seasonal,appliances
Neat Living,5-Tier Storage Shelf Black,Storage,49.99,17.50,6800,In Stock,,storage,organization
Enbrighten,LED Landscape Lights 6-Pack,Lighting,59.99,21.00,1900,In Stock,,lighting,outdoor
Cool Living,8000 BTU Portable AC Unit,Cooling,299.99,,2400,Network,,cooling,appliances`;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function KmsDealEmailGenerator() {
  const [step, setStep] = useState(1); // 1=Upload, 2=Review, 3=Configure, 4=Output
  const [csvText, setCsvText] = useState('');
  const [products, setProducts] = useState([]);
  const [config, setConfig] = useState({
    categories: [],
    date: new Date().toISOString().split('T')[0],
    featuredCount: 2,
  });
  const [emailHTML, setEmailHTML] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  // Step 1: Parse CSV
  const handleParse = useCallback(() => {
    const parsed = parseCSV(csvText).map(normalizeProduct);
    if (parsed.length === 0) return;
    setProducts(parsed);
    const cats = [...new Set(parsed.map(p => p.category).filter(Boolean))];
    setConfig(c => ({ ...c, categories: cats, featuredCount: Math.min(2, parsed.length) }));
    setStep(2);
  }, [csvText]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  // Step 2: Edit product
  const updateProduct = (idx, field, value) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removeProduct = (idx) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  // Step 3: Generate
  const handleGenerate = () => {
    const html = generateEmailHTML(products, config);
    setEmailHTML(html);
    setStep(4);
  };

  // Step 4: Copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = emailHTML;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Render ──
  return (
    <div style={styles.container}>
      {/* Logo */}
      <div style={styles.header}>
        <span style={styles.logoKms}>KMS</span>
        <span style={styles.logoDot}>.</span>
        <span style={styles.logoDeals}>deals</span>
      </div>
      <p style={styles.subtitle}>Email Generator — Wholesale deal emails from CSV data</p>

      {/* Step Indicators */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {['Upload CSV', 'Review Products', 'Configure', 'Generated Email'].map((name, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', cursor: step > i + 1 ? 'pointer' : 'default', opacity: step >= i + 1 ? 1 : 0.4 }}
               onClick={() => step > i + 1 && setStep(i + 1)}>
            <div style={{ ...styles.step, ...(step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : styles.stepPending) }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 600 : 400, color: step >= i + 1 ? BRAND.navy : BRAND.textLight }}>{name}</span>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Upload CSV ── */}
      {step === 1 && (
        <div style={styles.card}>
          <p style={styles.label}>Paste CSV or upload file</p>
          <textarea
            style={styles.textarea}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="brand,title,category,msrp,cost,qty,status,image_url,match_tags&#10;Enbrighten,Flameless LED Candles,...,Lighting,24.99,8.50,2400,In Stock,,lighting"
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleParse} disabled={!csvText.trim()}>
              Parse CSV
            </button>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => fileInputRef.current?.click()}>
              Upload File
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} style={{ display: 'none' }} />
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setCsvText(SAMPLE_CSV)}>
              Load Sample
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review Products ── */}
      {step === 2 && (
        <div style={styles.card}>
          <p style={styles.label}>{products.length} Products Parsed</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Brand', 'Title', 'Category', 'MSRP', 'Cost', 'Qty', 'Status', 'Match Tags', ''].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td style={styles.td}><input style={styles.tdInput} value={p.brand} onChange={e => updateProduct(i, 'brand', e.target.value)} /></td>
                    <td style={{ ...styles.td, minWidth: 180 }}><input style={styles.tdInput} value={p.title} onChange={e => updateProduct(i, 'title', e.target.value)} /></td>
                    <td style={styles.td}><input style={styles.tdInput} value={p.category} onChange={e => updateProduct(i, 'category', e.target.value)} /></td>
                    <td style={styles.td}><input style={{ ...styles.tdInput, fontFamily: FONT.mono }} value={p.msrp} onChange={e => updateProduct(i, 'msrp', e.target.value)} /></td>
                    <td style={styles.td}><input style={{ ...styles.tdInput, fontFamily: FONT.mono }} value={p.cost} onChange={e => updateProduct(i, 'cost', e.target.value)} /></td>
                    <td style={styles.td}><input style={{ ...styles.tdInput, fontFamily: FONT.mono }} value={p.qty} onChange={e => updateProduct(i, 'qty', e.target.value)} /></td>
                    <td style={styles.td}>
                      <select style={{ ...styles.tdInput, padding: '4px 4px' }} value={p.status} onChange={e => updateProduct(i, 'status', e.target.value)}>
                        <option value="In Stock">In Stock</option>
                        <option value="Network">Network</option>
                      </select>
                    </td>
                    <td style={styles.td}><input style={styles.tdInput} value={p.match_tags} onChange={e => updateProduct(i, 'match_tags', e.target.value)} /></td>
                    <td style={styles.td}>
                      <button onClick={() => removeProduct(i)} style={{ ...styles.btn, padding: '4px 8px', background: 'transparent', color: BRAND.textLight, fontSize: 14, border: 'none' }} title="Remove">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setStep(1)}>Back</button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setStep(3)}>Continue</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Configure ── */}
      {step === 3 && (
        <div style={styles.card}>
          <p style={styles.label}>Email Configuration</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: BRAND.textMid, display: 'block', marginBottom: 4 }}>Email Date</label>
              <input type="date" style={styles.input} value={config.date} onChange={e => setConfig(c => ({ ...c, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: BRAND.textMid, display: 'block', marginBottom: 4 }}>Featured Cards (rest go to list)</label>
              <input type="number" min={0} max={products.length} style={styles.input} value={config.featuredCount}
                onChange={e => setConfig(c => ({ ...c, featuredCount: Math.min(products.length, Math.max(0, parseInt(e.target.value) || 0)) }))} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: BRAND.textMid, display: 'block', marginBottom: 6 }}>Category Tags (click to remove)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {config.categories.map((cat, i) => (
                <span key={i} style={{ ...styles.tag, ...styles.tagCat, cursor: 'pointer' }}
                  onClick={() => setConfig(c => ({ ...c, categories: c.categories.filter((_, j) => j !== i) }))}>
                  {cat} ×
                </span>
              ))}
              <input placeholder="+ Add category" style={{ ...styles.tdInput, width: 120, fontSize: 10 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setConfig(c => ({ ...c, categories: [...c.categories, e.target.value.trim()] }));
                    e.target.value = '';
                  }
                }} />
            </div>
          </div>
          <div style={{ padding: 14, background: BRAND.lightBg, borderRadius: 6, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: BRAND.textMid }}>
              <strong style={{ color: BRAND.navy }}>{Math.min(config.featuredCount, products.length)}</strong> featured deal card{config.featuredCount !== 1 ? 's' : ''} +{' '}
              <strong style={{ color: BRAND.navy }}>{Math.max(0, products.length - config.featuredCount)}</strong> list item{products.length - config.featuredCount !== 1 ? 's' : ''} in "Also available"
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setStep(2)}>Back</button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleGenerate}>Generate Email HTML</button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Output ── */}
      {step === 4 && (
        <>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ ...styles.label, margin: 0 }}>Generated HTML</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setStep(3)}>Back</button>
                <button style={{ ...styles.btn, ...(copied ? styles.btnSuccess : styles.btnPrimary) }} onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy HTML'}
                </button>
              </div>
            </div>
            <textarea readOnly value={emailHTML} style={{ ...styles.textarea, minHeight: 200, fontSize: 11 }} />
          </div>

          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <p style={{ ...styles.label, margin: 0, padding: '14px 24px', borderBottom: `1px solid ${BRAND.border}` }}>Email Preview</p>
            <div ref={previewRef} style={{ background: BRAND.outerBg, padding: 16 }}>
              <iframe
                title="Email Preview"
                srcDoc={emailHTML}
                style={{ width: '100%', height: 900, border: 'none', borderRadius: 6 }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
