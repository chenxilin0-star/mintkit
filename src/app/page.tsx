'use client';

import { useState, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ProductIdea, ProductContent } from '@/lib/openai';
import { downloadPDF } from '@/lib/pdfGenerator';
import { TEMPLATE_OPTIONS, TemplateId, renderTemplate } from '@/lib/productTemplates';

type Step = 'input' | 'ideas' | 'template' | 'generating' | 'preview';

const typeColors: Record<string, string> = {
  Planner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Checklist: 'bg-blue-100 text-blue-700 border-blue-200',
  Guide: 'bg-violet-100 text-violet-700 border-violet-200',
  Workbook: 'bg-amber-100 text-amber-700 border-amber-200',
  Journal: 'bg-pink-100 text-pink-700 border-pink-200',
  Tracker: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const templatePreviews: Record<TemplateId, { bg: string; accent: string; label: string }> = {
  modern: { bg: '#f0fdf4', accent: '#10B981', label: '现代简约' },
  professional: { bg: '#eff6ff', accent: '#1E3A5F', label: '专业商务' },
  fresh: { bg: '#fdf2f8', accent: '#F472B6', label: '清新活泼' },
  minimal: { bg: '#ffffff', accent: '#374151', label: '极简白' },
  magazine: { bg: '#fef2f2', accent: '#DC2626', label: '潮流杂志' },
};

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [niche, setNiche] = useState('');
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProductIdea | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern');
  const [product, setProduct] = useState<ProductContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationsLeft, setGenerationsLeft] = useState(3);
  const { data: session, status } = useSession();
  const previewRef = useRef<HTMLDivElement>(null);

  async function handleGenerateIdeas() {
    if (!niche.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(data.ideas);
      setStep('ideas');
      setGenerationsLeft((g) => g - 1);
    } catch (e: any) {
      setError(e.message || 'Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectIdea(idea: ProductIdea) {
    setSelectedIdea(idea);
    setStep('template');
  }

  async function handleConfirmTemplate() {
    setStep('generating');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: selectedIdea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduct(data.product);
      setStep('preview');
    } catch (e: any) {
      setError(e.message || 'Failed to generate product');
      setStep('template');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!product) return;
    // Pass raw markdown content (product.content), NOT the pre-rendered innerHTML.
    // renderTemplate() / mdToHtml() handles markdown→HTML conversion.
    const filename = product.title.replace(/[^a-z0-9]/gi, '_');
    await downloadPDF(product.content, filename, selectedTemplate);
  }

  function handleCopyContent() {
    if (!product) return;
    navigator.clipboard.writeText(product.content);
    alert('Content copied to clipboard!');
  }

  function handleBack() {
    if (step === 'template') {
      setStep('ideas');
    } else if (step === 'preview') {
      setStep('template');
      setProduct(null);
    }
  }

  function handleReset() {
    setStep('input');
    setNiche('');
    setIdeas([]);
    setSelectedIdea(null);
    setProduct(null);
    setSelectedTemplate('modern');
    setError('');
  }

  function renderPreview(content: string) {
    return content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- \[ \] (.+)$/gm, '<div class="checkbox"><span class="box"></span>$1</div>')
      .replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked"><span class="box checked-box">✓</span>$1</div>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="numbered">$1</li>')
      .replace(/\n\n/g, '<p style="margin:10px 0;"></p>')
      .replace(/\n/g, '<br>');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">MintKit</h1>
              <p className="text-xs text-gray-500">AI Digital Product Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step !== 'input' && (
              <button
                onClick={step === 'preview' ? handleBack : handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {step === 'preview' ? '← Back' : '← New'}
              </button>
            )}

            {/* Auth Section */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {session.user?.email}
                  </p>
                </div>
                <img
                  src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}&background=10B981&color=fff`}
                  alt={session.user?.name || 'User'}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors ml-1"
                  title="Sign out"
                >
                  ⎋
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="text-sm px-4 py-2 min-h-[36px] bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step 1: Niche Input */}
        {step === 'input' && (
          <div className="text-center">
            <div className="mb-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                Turn Your Niche Into<br />
                <span className="text-emerald-600">Sellable Digital Products</span>
              </h1>
              <p className="text-gray-500 text-base max-w-md mx-auto">
                Enter any niche, get 5 product ideas, generate a complete PDF checklist or planner, and sell on Gumroad.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                What&apos;s your niche?
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}
                  placeholder="e.g., french learning, dog training, small garden..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]"
                />
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loading || !niche.trim()}
                  className="px-6 py-3 min-h-[44px] bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Generating...
                    </span>
                  ) : 'Generate Ideas'}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-red-500 text-left">{error}</p>}
              <p className="mt-4 text-xs text-gray-400 text-left">
                💡 Tip: Be specific. &quot;French learning for kids&quot; beats &quot;language learning&quot;
              </p>
            </div>

            <div className="mt-8 flex justify-center gap-8 text-center">
              <div>
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs text-gray-500">5 Ideas</div>
              </div>
              <div>
                <div className="text-2xl mb-1">📄</div>
                <div className="text-xs text-gray-500">Full PDF</div>
              </div>
              <div>
                <div className="text-2xl mb-1">💰</div>
                <div className="text-xs text-gray-500">Sell on Gumroad</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Idea List */}
        {step === 'ideas' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                5 Product Ideas for <span className="text-emerald-600">&quot;{niche}&quot;</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Pick one to generate the full product</p>
            </div>

            <div className="space-y-4">
              {ideas.map((idea, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${typeColors[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                          {idea.type}
                        </span>
                        <span className="text-xs text-gray-400">{idea.pageCount} pages</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{idea.title}</h3>
                      <p className="text-sm text-gray-500 mb-3 truncate">👤 {idea.targetUser}</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {idea.features.slice(0, 3).map((f, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                            <span className="break-words">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleSelectIdea(idea)}
                      className="px-5 py-3 min-h-[44px] bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap sm:shrink-0"
                    >
                      Select →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {generationsLeft > 0 ? `${generationsLeft} generation${generationsLeft !== 1 ? 's' : ''} left today` : 'No generations left today'}
              </p>
              {generationsLeft > 0 && (
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loading}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  🔄 Regenerate
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2.5: Template Selection */}
        {step === 'template' && selectedIdea && (
          <div>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Choose a Template
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pick a style for your <span className="text-emerald-600">{selectedIdea.type}</span>: &quot;{selectedIdea.title}&quot;
              </p>
            </div>

            {/* Selected idea summary */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 mb-6 flex items-center justify-between">
              <div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${typeColors[selectedIdea.type] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedIdea.type}
                </span>
                <span className="ml-3 font-medium text-gray-800 text-sm">{selectedIdea.title}</span>
              </div>
              <button onClick={() => setStep('ideas')} className="text-xs text-gray-400 hover:text-gray-600">
                Change
              </button>
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {TEMPLATE_OPTIONS.map((tpl) => {
                const preview = templatePreviews[tpl.id];
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Mini preview card */}
                    <div
                      className="rounded-xl p-3 mb-3 relative overflow-hidden"
                      style={{ background: preview.bg }}
                    >
                      <div className="absolute top-1.5 right-2 text-xs font-bold opacity-30" style={{ color: preview.accent }}>
                        {tpl.emoji}
                      </div>
                      <div
                        className="w-8 rounded mb-2"
                        style={{ height: 8, background: preview.accent }}
                      />
                      <div className="bg-white/70 rounded mb-1.5" style={{ height: 5, width: '70%' }} />
                      <div className="bg-white/50 rounded" style={{ height: 5, width: '90%' }} />
                      <div className="mt-2 flex gap-1.5">
                        <div className="w-4 h-4 rounded" style={{ border: `1.5px solid ${preview.accent}` }} />
                        <div className="bg-white/60 rounded" style={{ height: 5, width: '60%' }} />
                      </div>
                    </div>

                    <div className="font-semibold text-gray-800 text-sm">{tpl.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tpl.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{tpl.bestFor}</div>
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmTemplate}
                disabled={loading}
                className="flex-1 min-h-[44px] px-6 py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Generating...
                  </>
                ) : (
                  <>Generate Product →</>
                )}
              </button>
              <button
                onClick={() => setStep('ideas')}
                className="px-6 py-3.5 min-h-[44px] bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="text-center py-20">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Your Product...</h2>
              <p className="text-gray-500">Creating a complete {selectedIdea?.type} for &quot;{selectedIdea?.title}&quot;</p>
              <p className="text-sm text-gray-400 mt-2">
                Template: <span className="font-medium">{TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate)?.name}</span>
              </p>
              <p className="text-sm text-gray-400">Usually takes 2-3 minutes</p>
            </div>
          </div>
        )}

        {/* Step 4: Preview + Download */}
        {step === 'preview' && product && (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${typeColors[product.type]}`}>
                  {product.type}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate)?.emoji} {TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate)?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{product.title}</h2>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">PDF Preview</span>
                </div>
                <span className="text-xs text-gray-400">A4 Portrait</span>
              </div>
              <div
                ref={previewRef}
                className="max-h-[500px] overflow-y-auto text-sm preview-pdf-content"
              >
                <iframe
                  srcDoc={renderTemplate(selectedTemplate, product.title, product.content)}
                  className="w-full border-0"
                  style={{ height: '600px' }}
                  title="PDF Preview"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                📥 Download PDF
              </button>
              <button
                onClick={handleCopyContent}
                className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                📋 Copy Content
              </button>
            </div>

            {/* Template change */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setStep('template')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                🔄 Change Template
              </button>
            </div>

            {/* Gumroad Guide */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                🚀 Ready to sell on Gumroad?
              </h3>
              <ol className="text-sm text-amber-700 space-y-2">
                <li className="flex gap-2">
                  <span className="font-medium">1.</span>
                  Go to <a href="https://gumroad.com/products/new" target="_blank" rel="noopener" className="underline font-medium">gumroad.com/products/new</a>
                </li>
                <li className="flex gap-2"><span className="font-medium">2.</span> Fill in title and description</li>
                <li className="flex gap-2"><span className="font-medium">3.</span> Set price (try $9.99 or $14.99)</li>
                <li className="flex gap-2"><span className="font-medium">4.</span> Upload your PDF and publish!</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-sm text-gray-400">
          Built with MintKit · Start selling your digital products today
        </div>
      </footer>
    </div>
  );
}
