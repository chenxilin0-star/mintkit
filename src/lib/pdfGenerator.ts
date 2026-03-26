// pdfGenerator.ts - PDF download using html2pdf.js (iframe rendering for fonts + native pagebreaks)
// Templates are defined in productTemplates.ts

export async function downloadPDF(
  html: string,
  filename: string,
  templateId: TemplateId = 'modern'
) {
  const styledHTML = renderTemplate(templateId, filename.replace(/_/g, ' '), html);

  // Create a hidden iframe to render the full HTML document (proper font/CSS rendering)
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;

  iframeDoc.open();
  iframeDoc.write(styledHTML);
  iframeDoc.close();

  // Wait for content + fonts to fully render
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 2500); // Fallback
  });

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (html2pdf() as any)
      .set({
        margin: [15, 15, 15, 15], // top, right, bottom, left in mm
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
        },
      })
      .from(iframeDoc.body)
      .save();
  } finally {
    document.body.removeChild(iframe);
  }
}

// Legacy export for backward compatibility
export async function downloadPDFLegacy(html: string, filename: string) {
  return downloadPDF(html, filename, 'modern');
}

// ============================================================
// TEMPLATE FUNCTIONS (same as productTemplates.ts - kept for standalone use)
// ============================================================

// 5 Premium PDF Templates for MintKit
// All CSS inline, A4-ready, Chinese-friendly

export type TemplateId = 'modern' | 'professional' | 'fresh' | 'minimal' | 'magazine';

export interface TemplateOption {
  id: TemplateId;
  name: string;
  emoji: string;
  description: string;
  bestFor: string;
  accentColor: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'modern',
    name: '现代简约',
    emoji: '🌿',
    description: '薄荷绿主题，清新现代',
    bestFor: 'Planner, Checklist',
    accentColor: '#10B981',
  },
  {
    id: 'professional',
    name: '专业商务',
    emoji: '💼',
    description: '深蓝+金色点缀',
    bestFor: 'Guide, Workbook',
    accentColor: '#1E3A5F',
  },
  {
    id: 'fresh',
    name: '清新活泼',
    emoji: '🌸',
    description: '珊瑚粉+柔和圆角',
    bestFor: 'Journal, Tracker',
    accentColor: '#F472B6',
  },
  {
    id: 'minimal',
    name: '极简白',
    emoji: '⚪',
    description: '黑白+单一强调色',
    bestFor: 'All Types',
    accentColor: '#374151',
  },
  {
    id: 'magazine',
    name: '潮流杂志',
    emoji: '🔥',
    description: '大字体+撞色视觉',
    bestFor: 'All Types',
    accentColor: '#DC2626',
  },
];

// Convert markdown to HTML (basic)
function mdToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="checkbox"><span class="box"></span><span class="text">$1</span></div>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked"><span class="box checked-box">✓</span><span class="text">$1</span></div>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="numbered">$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '\n');
  return `<p>${html}</p>`;
}

// ============================================================
// TEMPLATE 1: 现代简约 (Modern Minimal - Mint Green)
// ============================================================
function getModernTemplate(title: string, content: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:11pt;line-height:1.8;color:#1a1a2e;background:#fff}
.wrapper{width:180mm;margin:0 auto;padding:15mm}
.header{margin-bottom:40px}
.header-top{display:flex;align-items:center;gap:14px;margin-bottom:30px}
.accent-bar{width:6px;height:48px;background:${accentColor};border-radius:3px}
.header-text h1{font-size:22pt;font-weight:700;color:#1a1a2e;letter-spacing:-0.5px;line-height:1.2}
.header-text .subtitle{font-size:9pt;color:#888;margin-top:4px;letter-spacing:1px;text-transform:uppercase}
.divider{height:2px;background:linear-gradient(to right,${accentColor},${accentColor}40);border-radius:2px;margin-bottom:35px}
.content h1{font-size:15pt;font-weight:700;color:${accentColor};margin:30px 0 12px 0;padding-bottom:6px}
.content h2{font-size:12pt;font-weight:600;color:#333;margin:22px 0 10px 0;padding-bottom:5px;border-bottom:1px solid #f0f0f0}
.content h3{font-size:11pt;font-weight:600;color:#555;margin:16px 0 8px 0}
.content p{margin-bottom:10px;color:#444}
.content ul{margin:10px 0 14px 24px}
.content li{margin-bottom:7px;color:#444}
.content strong{font-weight:600;color:#1a1a2e}
.checkbox{display:flex;align-items:flex-start;margin:9px 0;padding:8px 12px;background:#f8fffe;border-radius:8px;border:1px solid #e8f5f0}
.box{flex-shrink:0;width:18px;height:18px;border:2px solid ${accentColor};border-radius:4px;margin-right:12px;margin-top:1px}
.checked-box{background:${accentColor};border-color:${accentColor};color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:18px;text-align:center}
.text{flex:1;color:#333}
.footer{margin-top:50px;padding-top:18px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center}
.footer-brand{font-size:8pt;color:#bbb}
.footer-brand span{color:${accentColor};font-weight:600}
@page{size:A4;margin:15mm}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div class="header-top">
<div class="accent-bar"></div>
<div class="header-text">
<h1>${title}</h1>
<div class="subtitle">Digital Product · Created with MintKit</div>
</div>
</div>
<div class="divider"></div>
</div>
<div class="content">${mdToHtml(content)}</div>
<div class="footer">
<span class="footer-brand">Created with <span>MintKit</span></span>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE 2: 专业商务 (Professional Business - Deep Blue)
// ============================================================
function getProfessionalTemplate(title: string, content: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:11pt;line-height:1.8;color:#1e1e1e;background:#fff}
.wrapper{width:180mm;margin:0 auto;padding:15mm}
.header{position:relative;margin-bottom:40px;padding-bottom:28px}
.header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(to right,${accentColor} 0%,#d4a843 60%,transparent 100%)}
.header-eyebrow{font-size:8pt;color:${accentColor};letter-spacing:3px;text-transform:uppercase;font-weight:600;margin-bottom:10px}
.header h1{font-size:24pt;font-weight:700;color:#0d1b2a;letter-spacing:-0.5px;line-height:1.15}
.header-rule{width:60px;height:2px;background:${accentColor};margin-top:14px}
.content h1{font-size:15pt;font-weight:700;color:${accentColor};margin:35px 0 14px 0}
.content h2{font-size:12pt;font-weight:600;color:#0d1b2a;margin:25px 0 12px 0;padding-bottom:7px;border-bottom:2px solid ${accentColor}20}
.content h3{font-size:11pt;font-weight:600;color:#333;margin:18px 0 9px 0}
.content p{margin-bottom:10px;color:#3a3a3a}
.content ul{margin:10px 0 14px 26px;list-style:none}
.content li{margin-bottom:8px;color:#3a3a3a;position:relative;padding-left:14px}
.content li::before{content:'▸';position:absolute;left:0;color:${accentColor};font-size:9pt;top:2px}
.content li.numbered::before{content:counter(item) '.';counter-increment:item;color:${accentColor};font-weight:600}
.content strong{font-weight:700;color:#0d1b2a}
.checkbox{display:flex;align-items:flex-start;margin:9px 0;padding:10px 14px;background:#f5f7fa;border-radius:6px;border-left:3px solid ${accentColor}}
.box{flex-shrink:0;width:16px;height:16px;border:2px solid #888;border-radius:2px;margin-right:12px;margin-top:2px}
.checked-box{background:${accentColor};border-color:${accentColor};color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;line-height:16px;text-align:center;font-weight:700}
.text{flex:1;color:#1e1e1e}
.section-box{background:#f5f7fa;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #e8ecf0}
.footer{margin-top:55px;padding-top:16px;border-top:1px solid #e0e4ea;display:flex;justify-content:space-between;align-items:center}
.footer-brand{font-size:8pt;color:#aaa}
.footer-brand span{color:${accentColor};font-weight:700}
.footer-brand .dot{color:${accentColor};margin:0 4px}
@page{size:A4;margin:15mm}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div class="header-eyebrow">Premium Digital Product</div>
<h1>${title}</h1>
<div class="header-rule"></div>
</div>
<div class="content">${mdToHtml(content)}</div>
<div class="footer">
<span class="footer-brand"><span>MintKit</span><span class="dot">·</span>Professional Digital Products</span>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE 3: 清新活泼 (Fresh & Playful - Coral Pink)
// ============================================================
function getFreshTemplate(title: string, content: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:11pt;line-height:1.9;color:#2d2d2d;background:#fff}
.wrapper{width:180mm;margin:0 auto;padding:15mm}
.header{margin-bottom:38px;text-align:center}
.emoji-badge{font-size:28pt;margin-bottom:14px}
.header h1{font-size:20pt;font-weight:700;color:#2d2d2d;margin-bottom:8px;letter-spacing:-0.3px}
.header .subtitle{font-size:9pt;color:#aaa;letter-spacing:2px}
.wave-divider{height:4px;background:linear-gradient(to right,transparent,${accentColor},transparent);border-radius:2px;margin:24px 0}
.wave-divider2{height:2px;background:linear-gradient(to right,transparent,#fda4af33,transparent);border-radius:2px;margin:30px 0}
.content h1{font-size:14pt;font-weight:700;color:${accentColor};margin:30px 0 12px 0;text-align:center}
.content h2{font-size:12pt;font-weight:600;color:#444;margin:22px 0 10px 0;padding:8px 16px;background:#fff5f7;border-radius:20px;display:inline-block}
.content h3{font-size:11pt;font-weight:600;color:#555;margin:16px 0 8px 0}
.content p{margin-bottom:10px;color:#444}
.content ul{margin:10px 0 14px 24px}
.content li{margin-bottom:8px;color:#444}
.content strong{font-weight:700;color:#2d2d2d}
.checkbox{display:flex;align-items:flex-start;margin:9px 0;padding:10px 14px;background:#fff5f7;border-radius:16px;border:1.5px solid #fda4af50}
.box{flex-shrink:0;width:20px;height:20px;border:2px solid ${accentColor};border-radius:50%;margin-right:12px;margin-top:1px;flex-shrink:0}
.checked-box{background:${accentColor};border-color:${accentColor};color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:20px;text-align:center;font-weight:700}
.text{flex:1;color:#444}
.sticker-box{background:#fff5f7;border-radius:20px;padding:16px 20px;margin:18px 0;border:1px dashed #fda4af60;text-align:center}
.footer{margin-top:50px;padding-top:16px;border-top:2px dashed #fda4af40;text-align:center}
.footer-brand{font-size:8pt;color:#ccc}
.footer-brand span{color:${accentColor};font-weight:700}
.footer-brand .heart{color:${accentColor}}
@page{size:A4;margin:15mm}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div class="emoji-badge">✨</div>
<h1>${title}</h1>
<div class="subtitle">YOUR PERSONAL DIGITAL PRODUCT</div>
</div>
<div class="wave-divider"></div>
<div class="content">${mdToHtml(content)}</div>
<div class="wave-divider2"></div>
<div class="footer">
<span class="footer-brand">Made with <span class="heart">♥</span> <span>MintKit</span></span>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE 4: 极简白 (Minimal White - Black & White)
// ============================================================
function getMinimalTemplate(title: string, content: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:11pt;line-height:2;color:#111;background:#fff}
.wrapper{width:180mm;margin:0 auto;padding:15mm}
.header{margin-bottom:45px}
.header h1{font-size:26pt;font-weight:800;color:#111;line-height:1.1;letter-spacing:-1px}
.header-line{width:40px;height:3px;background:#111;margin:18px 0}
.header .subtitle{font-size:8pt;color:#999;letter-spacing:3px;text-transform:uppercase}
.content h1{font-size:14pt;font-weight:700;color:#111;margin:40px 0 14px 0;letter-spacing:-0.3px}
.content h2{font-size:12pt;font-weight:600;color:#111;margin:28px 0 12px 0;padding-bottom:6px}
.content h3{font-size:11pt;font-weight:600;color:#444;margin:18px 0 8px 0}
.content p{margin-bottom:12px;color:#333}
.content ul{margin:10px 0 14px 22px}
.content li{margin-bottom:8px;color:#333}
.content strong{font-weight:700;color:#111}
.checkbox{display:flex;align-items:flex-start;margin:10px 0;padding:10px 0;border-bottom:1px solid #f0f0f0}
.box{flex-shrink:0;width:16px;height:16px;border:1.5px solid #111;border-radius:2px;margin-right:14px;margin-top:2px;flex-shrink:0}
.checked-box{background:#111;border-color:#111;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;line-height:16px;text-align:center;font-weight:700}
.text{flex:1;color:#333}
.footer{margin-top:60px;padding-top:20px;border-top:1px solid #eee}
.footer-brand{font-size:8pt;color:#ccc}
.footer-brand span{color:#111;font-weight:700}
@page{size:A4;margin:15mm}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>${title}</h1>
<div class="header-line"></div>
<div class="subtitle">Digital Product · MintKit</div>
</div>
<div class="content">${mdToHtml(content)}</div>
<div class="footer">
<span class="footer-brand"><span>MintKit</span></span>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE 5: 潮流杂志 (Magazine - Bold Typography)
// ============================================================
function getMagazineTemplate(title: string, content: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:11pt;line-height:1.8;color:#1a1a1a;background:#fff}
.wrapper{width:180mm;margin:0 auto;padding:15mm}
.header{margin-bottom:35px;padding:30px 35px;background:${accentColor};border-radius:12px;position:relative;overflow:hidden}
.header::before{content:'MINTKIT';position:absolute;top:12px;right:18px;font-size:7pt;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:4px}
.header::after{content:'';position:absolute;bottom:-20px;right:-20px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%}
.header h1{font-size:26pt;font-weight:800;color:#fff;line-height:1.1;letter-spacing:-0.5px}
.header .tagline{font-size:9pt;color:rgba(255,255,255,0.8);margin-top:10px;letter-spacing:1px;text-transform:uppercase}
.content{margin-top:30px}
.content h1{font-size:18pt;font-weight:800;color:${accentColor};margin:35px 0 14px 0;line-height:1.1}
.content h2{font-size:13pt;font-weight:700;color:#1a1a1a;margin:28px 0 12px 0;padding:10px 16px;background:#f5f5f5;border-left:4px solid ${accentColor};border-radius:0 6px 6px 0}
.content h3{font-size:11pt;font-weight:700;color:#333;margin:18px 0 8px 0}
.content p{margin-bottom:12px;color:#333}
.content ul{margin:10px 0 14px 22px}
.content li{margin-bottom:8px;color:#333;font-size:11pt}
.content strong{font-weight:800;color:#1a1a1a}
.checkbox{display:flex;align-items:flex-start;margin:10px 0;padding:12px 16px;background:#fafafa;border-radius:8px;border:1px solid #eee}
.box{flex-shrink:0;width:20px;height:20px;border:2px solid ${accentColor};border-radius:4px;margin-right:14px;margin-top:1px;flex-shrink:0}
.checked-box{background:${accentColor};border-color:${accentColor};color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:20px;text-align:center;font-weight:800}
.text{flex:1;color:#333;font-size:11pt}
.mag-callout{padding:18px 20px;background:${accentColor}10;border-radius:8px;border-left:4px solid ${accentColor};margin:20px 0}
.footer{margin-top:50px;padding-top:18px;border-top:2px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
.footer-brand{font-size:8pt;color:#ccc}
.footer-brand span{color:${accentColor};font-weight:800}
@page{size:A4;margin:15mm}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>${title}</h1>
<div class="tagline">Premium Digital Product · MintKit</div>
</div>
<div class="content">${mdToHtml(content)}</div>
<div class="footer">
<span class="footer-brand">Created with <span>MintKit</span></span>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// Main render function
// ============================================================
export function renderTemplate(
  templateId: TemplateId,
  title: string,
  content: string
): string {
  const accentColors: Record<TemplateId, string> = {
    modern: '#10B981',
    professional: '#1E3A5F',
    fresh: '#F472B6',
    minimal: '#374151',
    magazine: '#DC2626',
  };
  const accent = accentColors[templateId] || '#10B981';

  switch (templateId) {
    case 'modern':
      return getModernTemplate(title, content, accent);
    case 'professional':
      return getProfessionalTemplate(title, content, accent);
    case 'fresh':
      return getFreshTemplate(title, content, accent);
    case 'minimal':
      return getMinimalTemplate(title, content, accent);
    case 'magazine':
      return getMagazineTemplate(title, content, accent);
    default:
      return getModernTemplate(title, content, accent);
  }
}
