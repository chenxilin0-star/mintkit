export type TemplateType = 'Planner' | 'Checklist' | 'Guide';

export function getTemplateStyle(type: TemplateType): string {
  switch (type) {
    case 'Planner':
      return plannerCSS;
    case 'Checklist':
      return checklistCSS;
    case 'Guide':
      return guideCSS;
    default:
      return plannerCSS;
  }
}

function wrapInHTML(content: string, css: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
<div class="document">${content}</div>
</body>
</html>`;
}

export function markdownToHTML(markdown: string, type: TemplateType, title: string): string {
  const css = getTemplateStyle(type);
  
  // Simple markdown to HTML conversion
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Checklist items
    .replace(/^- \[ \] (.+)$/gm, '<div class="checkbox"><span class="box"></span>$1</div>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked"><span class="box checked-box"></span>$1</div>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="numbered">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap consecutive list items in ul
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '\n');
  
  return wrapInHTML(`<div class="header"><h1 class="title">${title}</h1><p class="subtitle">Created with MintKit</p></div><div class="content">${html}</div>`, css, title);
}

const baseCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; }
  .document { max-width: 800px; margin: 0 auto; padding: 40px 40px 40px 50px; }
  .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid; }
  .title { font-size: 28pt; font-weight: 700; margin-bottom: 8px; }
  .subtitle { font-size: 10pt; color: #888; }
  h1 { font-size: 22pt; font-weight: 700; margin: 30px 0 15px 0; page-break-before: auto; }
  h2 { font-size: 16pt; font-weight: 600; margin: 25px 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; }
  h3 { font-size: 13pt; font-weight: 600; margin: 20px 0 10px 0; }
  p { margin-bottom: 12px; }
  ul { margin: 10px 0 15px 25px; }
  li { margin-bottom: 8px; }
  .checkbox { display: flex; align-items: flex-start; margin-bottom: 10px; }
  .box { display: inline-block; width: 18px; height: 18px; border: 2px solid #333; border-radius: 3px; margin-right: 12px; flex-shrink: 0; margin-top: 2px; }
  .checked-box { background: #4CAF50; border-color: #4CAF50; position: relative; }
  .checked-box::after { content: '✓'; color: white; font-size: 12px; position: absolute; top: -2px; left: 3px; }
  .content { margin-top: 20px; }
  strong { font-weight: 600; }
  em { font-style: italic; }
  @page { size: A4; margin: 15mm; }
`;

const plannerCSS = `
  ${baseCSS}
  .header { border-bottom-color: #10B981; }
  .title { color: #10B981; }
  .document { background: linear-gradient(to bottom, #ffffff 0%, #f8fffe 100%); }
  h1, h2 { color: #10B981; }
  ul li::marker { color: #10B981; }
  .grid-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
  .grid-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; }
  .grid-item h3 { margin-top: 0; color: #10B981; font-size: 12pt; }
`;

const checklistCSS = `
  ${baseCSS}
  .header { border-bottom-color: #3B82F6; }
  .title { color: #3B82F6; }
  .document { background: #ffffff; }
  h1, h2 { color: #3B82F6; }
  ul li::marker { color: #3B82F6; }
  .category { background: #f8fafc; border-left: 4px solid #3B82F6; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
`;

const guideCSS = `
  ${baseCSS}
  .header { border-bottom-color: #8B5CF6; }
  .title { color: #8B5CF6; }
  .document { background: #ffffff; }
  h1, h2 { color: #8B5CF6; }
  h3 { color: #6366f1; }
  ul li::marker { color: #8B5CF6; }
  .chapter { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 25px; margin: 25px 0; }
  .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
  .action-box { background: #ecfdf5; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; }
`;
