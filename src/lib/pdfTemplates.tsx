// pdfTemplates.tsx - React-PDF template components for MintKit
// 5 premium templates matching the HTML/CSS preview designs

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Style } from '@react-pdf/stylesheet';

// ============================================================
// TYPES
// ============================================================

export type TemplateId = 'modern' | 'professional' | 'fresh' | 'minimal' | 'magazine';

type ContentItemType = 'h1' | 'h2' | 'h3' | 'p' | 'checkbox' | 'checkbox-checked' | 'bullet' | 'numbered' | 'divider';

interface ParsedContent {
  type: ContentItemType;
  text?: string;
  index?: number;
}

interface ContentStyles {
  h1Container: Style;
  h1: Style;
  h2Container: Style;
  h2: Style;
  h3: Style;
  paragraph: Style;
  checkboxContainer: Style;
  checkboxBox: Style;
  checkboxBoxChecked: Style;
  checkmark: Style;
  checkboxText: Style;
  checkboxTextChecked: Style;
  bulletContainer: Style;
  bulletDot: Style;
  bulletText: Style;
  numberedContainer: Style;
  numberedIndex: Style;
  numberedText: Style;
  divider: Style;
}

// ============================================================
// MARKDOWN PARSER
// ============================================================

function parseMarkdown(md: string): ParsedContent[] {
  const lines = md.split('\n');
  const result: ParsedContent[] = [];
  let numberedIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      result.push({ type: 'h1', text: trimmed.slice(2) });
    } else if (trimmed.startsWith('## ')) {
      result.push({ type: 'h2', text: trimmed.slice(3) });
    } else if (trimmed.startsWith('### ')) {
      result.push({ type: 'h3', text: trimmed.slice(4) });
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      result.push({ type: 'checkbox-checked', text: trimmed.slice(6) });
    } else if (trimmed.startsWith('- [ ] ')) {
      result.push({ type: 'checkbox', text: trimmed.slice(6) });
    } else if (trimmed.startsWith('- ')) {
      result.push({ type: 'bullet', text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      numberedIndex++;
      result.push({ type: 'numbered', text: trimmed.replace(/^\d+\.\s/, ''), index: numberedIndex });
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      result.push({ type: 'divider' });
    } else {
      result.push({ type: 'p', text: trimmed });
    }
  }

  return result;
}

// ============================================================
// BOLD TEXT RENDERER
// ============================================================

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part}</Text> : part
  );
}

// ============================================================
// CONTENT BLOCK RENDERER
// ============================================================

interface ContentBlockProps {
  content: ParsedContent[];
  templateId: TemplateId;
  accentColor: string;
}

function ContentBlock({ content, templateId, accentColor }: ContentBlockProps) {
  const styles = getContentStyles(templateId, accentColor);

  return (
    <View>
      {content.map((item, i) => {
        switch (item.type) {
          case 'h1':
            return (
              <View key={i} style={styles.h1Container}>
                <Text style={styles.h1}>{item.text}</Text>
              </View>
            );
          case 'h2':
            return (
              <View key={i} style={styles.h2Container}>
                <Text style={styles.h2}>{item.text}</Text>
              </View>
            );
          case 'h3':
            return <Text key={i} style={styles.h3}>{item.text}</Text>;
          case 'p':
            return (
              <Text key={i} style={styles.paragraph}>
                {renderBold(item.text || '')}
              </Text>
            );
          case 'checkbox':
            return (
              <View key={i} style={styles.checkboxContainer}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxText}>{item.text}</Text>
              </View>
            );
          case 'checkbox-checked':
            return (
              <View key={i} style={styles.checkboxContainer}>
                <View style={styles.checkboxBoxChecked}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.checkboxTextChecked}>{item.text}</Text>
              </View>
            );
          case 'bullet':
            return (
              <View key={i} style={styles.bulletContainer}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item.text}</Text>
              </View>
            );
          case 'numbered':
            return (
              <View key={i} style={styles.numberedContainer}>
                <Text style={styles.numberedIndex}>{item.index}.</Text>
                <Text style={styles.numberedText}>{item.text}</Text>
              </View>
            );
          case 'divider':
            return <View key={i} style={styles.divider} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

// ============================================================
// CONTENT STYLES FACTORY
// ============================================================

function getContentStyles(templateId: TemplateId, accentColor: string): ContentStyles {
  const s = accentColor;

  if (templateId === 'modern') {
    return {
      h1Container: { marginTop: 20, marginBottom: 8 },
      h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: s, marginBottom: 6 },
      h2Container: { marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 4 },
      h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#333' },
      h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 10, marginBottom: 4 },
      paragraph: { fontSize: 9.5, color: '#444', marginBottom: 6, lineHeight: 1.6 },
      checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#f8fffe', borderRadius: 6, borderWidth: 1, borderColor: '#e8f5f0' },
      checkboxBox: { width: 14, height: 14, borderWidth: 1.5, borderColor: s, borderRadius: 3, marginRight: 8, marginTop: 1 },
      checkboxBoxChecked: { width: 14, height: 14, backgroundColor: s, borderRadius: 3, marginRight: 8, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
      checkmark: { fontSize: 8, color: '#ffffff', fontWeight: 'bold' as const },
      checkboxText: { flex: 1, fontSize: 9.5, color: '#333' },
      checkboxTextChecked: { flex: 1, fontSize: 9.5, color: '#333' },
      bulletContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
      bulletDot: { fontSize: 9, color: s, marginRight: 6, marginTop: 0 },
      bulletText: { flex: 1, fontSize: 9.5, color: '#444' },
      numberedContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
      numberedIndex: { fontSize: 9, color: s, fontFamily: 'Helvetica-Bold', marginRight: 6, width: 16 },
      numberedText: { flex: 1, fontSize: 9.5, color: '#444' },
      divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 },
    };
  }

  if (templateId === 'professional') {
    return {
      h1Container: { marginTop: 20, marginBottom: 8 },
      h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: s, marginBottom: 6 },
      h2Container: { marginTop: 16, marginBottom: 8, borderBottomWidth: 1.5, borderBottomColor: `${s}20`, paddingBottom: 5 },
      h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0d1b2a' },
      h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#333', marginTop: 10, marginBottom: 4 },
      paragraph: { fontSize: 9.5, color: '#3a3a3a', marginBottom: 6, lineHeight: 1.6 },
      checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f5f7fa', borderRadius: 5, borderLeftWidth: 3, borderLeftColor: s },
      checkboxBox: { width: 12, height: 12, borderWidth: 1.5, borderColor: '#888', borderRadius: 2, marginRight: 8, marginTop: 1 },
      checkboxBoxChecked: { width: 12, height: 12, backgroundColor: s, borderRadius: 2, marginRight: 8, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
      checkmark: { fontSize: 7, color: '#ffffff', fontWeight: 'bold' as const },
      checkboxText: { flex: 1, fontSize: 9.5, color: '#1e1e1e' },
      checkboxTextChecked: { flex: 1, fontSize: 9.5, color: '#1e1e1e' },
      bulletContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3, paddingLeft: 12 },
      bulletDot: { fontSize: 9, color: s, marginRight: 6, marginTop: 0 },
      bulletText: { flex: 1, fontSize: 9.5, color: '#3a3a3a' },
      numberedContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3, paddingLeft: 12 },
      numberedIndex: { fontSize: 9, color: s, fontFamily: 'Helvetica-Bold', marginRight: 6, width: 16 },
      numberedText: { flex: 1, fontSize: 9.5, color: '#3a3a3a' },
      divider: { height: 1, backgroundColor: '#e0e4ea', marginVertical: 12 },
    };
  }

  if (templateId === 'fresh') {
    return {
      h1Container: { marginTop: 20, marginBottom: 8 },
      h1: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: s, marginBottom: 6 },
      h2Container: { marginTop: 14, marginBottom: 8 },
      h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#444', backgroundColor: '#fff5f7', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
      h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 10, marginBottom: 4 },
      paragraph: { fontSize: 9.5, color: '#444', marginBottom: 6, lineHeight: 1.7 },
      checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#fff5f7', borderRadius: 16, borderWidth: 1, borderColor: '#fda4af50' },
      checkboxBox: { width: 16, height: 16, borderWidth: 1.5, borderColor: s, borderRadius: 8, marginRight: 8, marginTop: 0 },
      checkboxBoxChecked: { width: 16, height: 16, backgroundColor: s, borderRadius: 8, marginRight: 8, marginTop: 0, justifyContent: 'center', alignItems: 'center' },
      checkmark: { fontSize: 8, color: '#ffffff', fontWeight: 'bold' as const },
      checkboxText: { flex: 1, fontSize: 9.5, color: '#444' },
      checkboxTextChecked: { flex: 1, fontSize: 9.5, color: '#444' },
      bulletContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
      bulletDot: { fontSize: 9, color: s, marginRight: 6, marginTop: 0 },
      bulletText: { flex: 1, fontSize: 9.5, color: '#444' },
      numberedContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
      numberedIndex: { fontSize: 9, color: s, fontFamily: 'Helvetica-Bold', marginRight: 6, width: 16 },
      numberedText: { flex: 1, fontSize: 9.5, color: '#444' },
      divider: { height: 2, backgroundColor: '#fda4af20', marginVertical: 12, borderRadius: 1 },
    };
  }

  if (templateId === 'minimal') {
    return {
      h1Container: { marginTop: 24, marginBottom: 8 },
      h1: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111', letterSpacing: -0.3, marginBottom: 6 },
      h2Container: { marginTop: 18, marginBottom: 8, paddingBottom: 4 },
      h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111' },
      h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#444', marginTop: 12, marginBottom: 4 },
      paragraph: { fontSize: 9.5, color: '#333', marginBottom: 8, lineHeight: 1.8 },
      checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
      checkboxBox: { width: 12, height: 12, borderWidth: 1.5, borderColor: '#111', borderRadius: 2, marginRight: 10, marginTop: 1 },
      checkboxBoxChecked: { width: 12, height: 12, backgroundColor: '#111', borderRadius: 2, marginRight: 10, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
      checkmark: { fontSize: 7, color: '#ffffff', fontWeight: 'bold' as const },
      checkboxText: { flex: 1, fontSize: 9.5, color: '#333' },
      checkboxTextChecked: { flex: 1, fontSize: 9.5, color: '#333' },
      bulletContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingLeft: 4 },
      bulletDot: { fontSize: 9, color: '#111', marginRight: 8, marginTop: 0 },
      bulletText: { flex: 1, fontSize: 9.5, color: '#333' },
      numberedContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingLeft: 4 },
      numberedIndex: { fontSize: 9, color: '#111', fontFamily: 'Helvetica-Bold', marginRight: 8, width: 16 },
      numberedText: { flex: 1, fontSize: 9.5, color: '#333' },
      divider: { height: 1, backgroundColor: '#111', marginVertical: 16 },
    };
  }

  // magazine
  return {
    h1Container: { marginTop: 24, marginBottom: 8 },
    h1: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: s, lineHeight: 1.1, marginBottom: 8 },
    h2Container: { marginTop: 18, marginBottom: 8 },
    h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', backgroundColor: '#f5f5f5', borderLeftWidth: 4, borderLeftColor: s, paddingVertical: 6, paddingHorizontal: 12 },
    h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#333', marginTop: 12, marginBottom: 4 },
    paragraph: { fontSize: 9.5, color: '#333', marginBottom: 8, lineHeight: 1.6 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    checkboxBox: { width: 16, height: 16, borderWidth: 1.5, borderColor: s, borderRadius: 3, marginRight: 10, marginTop: 1 },
    checkboxBoxChecked: { width: 16, height: 16, backgroundColor: s, borderRadius: 3, marginRight: 10, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
    checkmark: { fontSize: 8, color: '#ffffff', fontWeight: 'bold' as const },
    checkboxText: { flex: 1, fontSize: 10, color: '#333' },
    checkboxTextChecked: { flex: 1, fontSize: 10, color: '#333' },
    bulletContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
    bulletDot: { fontSize: 10, color: s, marginRight: 8, marginTop: 0, fontWeight: 'bold' as const },
    bulletText: { flex: 1, fontSize: 10, color: '#333' },
    numberedContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
    numberedIndex: { fontSize: 10, color: s, fontFamily: 'Helvetica-Bold', marginRight: 8, width: 16 },
    numberedText: { flex: 1, fontSize: 10, color: '#333' },
    divider: { height: 2, backgroundColor: '#f0f0f0', marginVertical: 14 },
  };
}

// ============================================================
// TEMPLATE 1: 现代简约 (Modern - Mint Green)
// ============================================================

const modernStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  accentBar: { width: 6, height: 44, backgroundColor: '#10B981', borderRadius: 3, marginRight: 14 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 8, color: '#888888', letterSpacing: 1, textTransform: 'uppercase' as const },
  divider: { height: 2, backgroundColor: '#10B981', borderRadius: 1, marginBottom: 28 },
  footer: { position: 'absolute' as const, bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 12, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  footerText: { fontSize: 8, color: '#bbbbbb' },
  footerAccent: { color: '#10B981', fontWeight: 'bold' as const },
  content: { flex: 1 },
});

function ModernTemplate({ title, content }: { title: string; content: string }) {
  const parsed = parseMarkdown(content);
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.headerTop}>
          <View style={modernStyles.accentBar} />
          <View style={modernStyles.headerText}>
            <Text style={modernStyles.title}>{title}</Text>
            <Text style={modernStyles.subtitle}>Digital Product · Created with MintKit</Text>
          </View>
        </View>
        <View style={modernStyles.divider} />
        <View style={modernStyles.content}>
          <ContentBlock content={parsed} templateId="modern" accentColor="#10B981" />
        </View>
        <View style={modernStyles.footer}>
          <Text style={modernStyles.footerText}>
            Created with <Text style={modernStyles.footerAccent}>MintKit</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================
// TEMPLATE 2: 专业商务 (Professional - Deep Blue + Gold)
// ============================================================

const professionalStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 28, paddingBottom: 20 },
  eyebrow: { fontSize: 8, color: '#1E3A5F', letterSpacing: 3, textTransform: 'uppercase' as const, fontWeight: 'bold' as const, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0d1b2a', letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 12 },
  rule: { width: 60, height: 2, backgroundColor: '#1E3A5F', marginTop: 8 },
  content: { flex: 1 },
  footer: { position: 'absolute' as const, bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e0e4ea', paddingTop: 12, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  footerText: { fontSize: 8, color: '#aaaaaa' },
  footerAccent: { color: '#1E3A5F', fontWeight: 'bold' as const },
  footerDot: { color: '#1E3A5F', marginHorizontal: 4 },
});

function ProfessionalTemplate({ title, content }: { title: string; content: string }) {
  const parsed = parseMarkdown(content);
  return (
    <Document>
      <Page size="A4" style={professionalStyles.page}>
        <View style={professionalStyles.header}>
          <Text style={professionalStyles.eyebrow}>Premium Digital Product</Text>
          <Text style={professionalStyles.title}>{title}</Text>
          <View style={professionalStyles.rule} />
        </View>
        <View style={professionalStyles.content}>
          <ContentBlock content={parsed} templateId="professional" accentColor="#1E3A5F" />
        </View>
        <View style={professionalStyles.footer}>
          <Text style={professionalStyles.footerText}>
            <Text style={professionalStyles.footerAccent}>MintKit</Text>
            <Text style={professionalStyles.footerDot}>·</Text>
            Professional Digital Products
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================
// TEMPLATE 3: 清新活泼 (Fresh - Coral Pink)
// ============================================================

const freshStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { alignItems: 'center' as const, marginBottom: 24 },
  emojiBadge: { fontSize: 26, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2d2d2d', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 8, color: '#aaaaaa', letterSpacing: 2 },
  waveDivider: { height: 3, backgroundColor: '#F472B6', borderRadius: 2, marginVertical: 20 },
  waveDivider2: { height: 2, backgroundColor: '#fda4af33', borderRadius: 1, marginVertical: 24 },
  content: { flex: 1 },
  footer: { position: 'absolute' as const, bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#fda4af40', paddingTop: 12, alignItems: 'center' as const },
  footerText: { fontSize: 8, color: '#cccccc', textAlign: 'center' as const },
  footerAccent: { color: '#F472B6', fontWeight: 'bold' as const },
  footerHeart: { color: '#F472B6' },
});

function FreshTemplate({ title, content }: { title: string; content: string }) {
  const parsed = parseMarkdown(content);
  return (
    <Document>
      <Page size="A4" style={freshStyles.page}>
        <View style={freshStyles.header}>
          <Text style={freshStyles.emojiBadge}>✨</Text>
          <Text style={freshStyles.title}>{title}</Text>
          <Text style={freshStyles.subtitle}>YOUR PERSONAL DIGITAL PRODUCT</Text>
        </View>
        <View style={freshStyles.waveDivider} />
        <View style={freshStyles.content}>
          <ContentBlock content={parsed} templateId="fresh" accentColor="#F472B6" />
        </View>
        <View style={freshStyles.waveDivider2} />
        <View style={freshStyles.footer}>
          <Text style={freshStyles.footerText}>
            Made with <Text style={freshStyles.footerHeart}>♥</Text> <Text style={freshStyles.footerAccent}>MintKit</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================
// TEMPLATE 4: 极简白 (Minimal - Black & White)
// ============================================================

const minimalStyles = StyleSheet.create({
  page: { padding: 48, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 36 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111111', letterSpacing: -1, lineHeight: 1.1, marginBottom: 14 },
  headerLine: { width: 36, height: 3, backgroundColor: '#111111', marginBottom: 12 },
  subtitle: { fontSize: 8, color: '#999999', letterSpacing: 3, textTransform: 'uppercase' as const },
  content: { flex: 1 },
  footer: { position: 'absolute' as const, bottom: 30, left: 48, right: 48, borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 14 },
  footerText: { fontSize: 8, color: '#cccccc' },
  footerAccent: { color: '#111111', fontWeight: 'bold' as const },
});

function MinimalTemplate({ title, content }: { title: string; content: string }) {
  const parsed = parseMarkdown(content);
  return (
    <Document>
      <Page size="A4" style={minimalStyles.page}>
        <View style={minimalStyles.header}>
          <Text style={minimalStyles.title}>{title}</Text>
          <View style={minimalStyles.headerLine} />
          <Text style={minimalStyles.subtitle}>Digital Product · MintKit</Text>
        </View>
        <View style={minimalStyles.content}>
          <ContentBlock content={parsed} templateId="minimal" accentColor="#374151" />
        </View>
        <View style={minimalStyles.footer}>
          <Text style={minimalStyles.footerText}>
            <Text style={minimalStyles.footerAccent}>MintKit</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================
// TEMPLATE 5: 潮流杂志 (Magazine - Bold Typography)
// ============================================================

const magazineStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { backgroundColor: '#DC2626', borderRadius: 10, padding: 28, marginBottom: 24, position: 'relative' as const, overflow: 'hidden' as const },
  headerTag: { position: 'absolute' as const, top: 10, right: 16, fontSize: 7, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' as const, letterSpacing: 4 },
  headerCircle: { position: 'absolute' as const, bottom: -20, right: -20, width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', letterSpacing: -0.5, lineHeight: 1.1 },
  tagline: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' as const },
  content: { flex: 1 },
  footer: { position: 'absolute' as const, bottom: 30, left: 40, right: 40, borderTopWidth: 2, borderTopColor: '#f0f0f0', paddingTop: 12, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  footerText: { fontSize: 8, color: '#cccccc' },
  footerAccent: { color: '#DC2626', fontWeight: 'bold' as const },
});

function MagazineTemplate({ title, content }: { title: string; content: string }) {
  const parsed = parseMarkdown(content);
  return (
    <Document>
      <Page size="A4" style={magazineStyles.page}>
        <View style={magazineStyles.header}>
          <Text style={magazineStyles.headerTag}>MINTKIT</Text>
          <View style={magazineStyles.headerCircle} />
          <Text style={magazineStyles.title}>{title}</Text>
          <Text style={magazineStyles.tagline}>Premium Digital Product · MintKit</Text>
        </View>
        <View style={magazineStyles.content}>
          <ContentBlock content={parsed} templateId="magazine" accentColor="#DC2626" />
        </View>
        <View style={magazineStyles.footer}>
          <Text style={magazineStyles.footerText}>
            Created with <Text style={magazineStyles.footerAccent}>MintKit</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export const TEMPLATE_COMPONENTS: Record<TemplateId, React.ComponentType<{ title: string; content: string }>> = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  fresh: FreshTemplate,
  minimal: MinimalTemplate,
  magazine: MagazineTemplate,
};

export const TEMPLATE_OPTIONS = [
  { id: 'modern' as TemplateId, name: '现代简约', emoji: '🌿', description: '薄荷绿主题，清新现代', bestFor: 'Planner, Checklist', accentColor: '#10B981' },
  { id: 'professional' as TemplateId, name: '专业商务', emoji: '💼', description: '深蓝+金色点缀', bestFor: 'Guide, Workbook', accentColor: '#1E3A5F' },
  { id: 'fresh' as TemplateId, name: '清新活泼', emoji: '🌸', description: '珊瑚粉+柔和圆角', bestFor: 'Journal, Tracker', accentColor: '#F472B6' },
  { id: 'minimal' as TemplateId, name: '极简白', emoji: '⚪', description: '黑白+单一强调色', bestFor: 'All Types', accentColor: '#374151' },
  { id: 'magazine' as TemplateId, name: '潮流杂志', emoji: '🔥', description: '大字体+撞色视觉', bestFor: 'All Types', accentColor: '#DC2626' },
];
