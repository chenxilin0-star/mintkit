'use client';

import { TemplateId, renderTemplate } from './productTemplates';

let html2pdfInstance: any = null;

async function getHtml2Pdf() {
  if (typeof window === 'undefined') return null;
  if (html2pdfInstance) return html2pdfInstance;
  const mod = await import('html2pdf.js');
  html2pdfInstance = mod.default || mod;
  return html2pdfInstance;
}

export async function downloadPDF(
  html: string,
  filename: string,
  templateId: TemplateId = 'modern'
) {
  const html2pdf = await getHtml2Pdf();
  if (!html2pdf) return;

  // Use the beautiful template
  const styledHTML = renderTemplate(templateId, filename.replace(/_/g, ' '), html);

  html2pdf().set({
    margin: 0,
    filename: `${filename}.pdf`,
    html2canvas: { scale: 2, useCORS: true, width: 800 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(styledHTML).save();
}

// Legacy export for backward compatibility
export async function downloadPDFLegacy(html: string, filename: string) {
  return downloadPDF(html, filename, 'modern');
}
