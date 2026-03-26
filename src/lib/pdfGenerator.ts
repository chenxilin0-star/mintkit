'use client';

let html2pdfInstance: any = null;

async function getHtml2Pdf() {
  if (typeof window === 'undefined') return null;
  if (html2pdfInstance) return html2pdfInstance;
  const mod = await import('html2pdf.js');
  html2pdfInstance = mod.default || mod;
  return html2pdfInstance;
}

export async function downloadPDF(html: string, filename: string) {
  const html2pdf = await getHtml2Pdf();
  if (!html2pdf) return;
  
  const styledHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.7; color: #333; }
  .pdf-container { padding: 50px 60px; max-width: 800px; margin: 0 auto; }
  .pdf-header { text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 3px solid #10B981; }
  .pdf-title { font-size: 26pt; font-weight: bold; color: #10B981; margin-bottom: 8px; }
  .pdf-subtitle { font-size: 10pt; color: #888; }
  .pdf-content { margin-top: 30px; }
  h1 { font-size: 20pt; font-weight: bold; color: #10B981; margin: 30px 0 15px 0; page-break-before: auto; }
  h2 { font-size: 15pt; font-weight: 600; color: #10B981; margin: 25px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  h3 { font-size: 12pt; font-weight: 600; color: #059669; margin: 18px 0 10px 0; }
  p { margin-bottom: 10px; }
  ul { margin: 8px 0 12px 28px; }
  li { margin-bottom: 7px; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  @page { size: A4; margin: 20mm; }
  .pdf-container { padding: 50px 60px; max-width: 800px; margin: 0 auto; }
</style>
</head>
<body>
<div class="pdf-container">
${html}
</div>
</body>
</html>`;

  html2pdf().set({
    margin: 0,
    filename: `${filename}.pdf`,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(styledHTML).save();
}
