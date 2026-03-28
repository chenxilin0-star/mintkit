// pdfGenerator.ts - PDF download using @react-pdf/renderer
// React-native PDF library that properly renders CSS styles

import { pdf } from '@react-pdf/renderer';
import { TEMPLATE_COMPONENTS, TemplateId } from './pdfTemplates';

export type { TemplateId };

export async function downloadPDF(
  content: string,
  filename: string,
  templateId: TemplateId = 'modern'
) {
  // Get the appropriate template component
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId];
  
  if (!TemplateComponent) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Extract title from markdown (first # heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : filename.replace(/_/g, ' ');

  // Create PDF document
  const doc = <TemplateComponent title={title} content={content} />;
  
  // Generate blob
  const blob = await pdf(doc).toBlob();
  
  // Create download URL
  const url = URL.createObjectURL(blob);
  
  // Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
}

// Legacy export for backward compatibility
export async function downloadPDFLegacy(content: string, filename: string) {
  return downloadPDF(content, filename, 'modern');
}
