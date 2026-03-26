'use client';

import { useState, useRef } from 'react';
import { ProductIdea, ProductContent } from '@/lib/openai';
import { downloadPDF } from '@/lib/pdfGenerator';

type Step = 'input' | 'ideas' | 'generating' | 'preview';

const typeColors: Record<string, string> = {
  Planner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Checklist: 'bg-blue-100 text-blue-700 border-blue-200',
  Guide: 'bg-violet-100 text-violet-700 border-violet-200',
};

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [niche, setNiche] = useState('');
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProductIdea | null>(null);
  const [product, setProduct] = useState<ProductContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationsLeft, setGenerationsLeft] = useState(3);
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

  async function handleSelectIdea(idea: ProductIdea) {
    setSelectedIdea(idea);
    setStep('generating');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduct(data.product);
      setStep('preview');
    } catch (e: any) {
      setError(e.message || 'Failed to generate product');
      setStep('ideas');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!product || !previewRef.current) return;
    const element = previewRef.current;
    const html = element.innerHTML;
    const filename = product.title.replace(/[^a-z0-9]/gi, '_');
    await downloadPDF(html, filename);
  }

  function handleCopyContent() {
    if (!product) return;
    navigator.clipboard.writeText(product.content);
    alert('Content copied to clipboard!');
  }

  function handleBack() {
    if (step === 'ideas') {
      setStep('input');
      setIdeas([]);
    } else if (step === 'preview') {
      setStep('ideas');
      setProduct(null);
    }
  }

  function handleReset() {
    setStep('input');
    setNiche('');
    setIdeas([]);
    setSelectedIdea(null);
    setProduct(null);
    setError('');
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
          {step !== 'input' && (
            <button
              onClick={step === 'preview' ? handleBack : handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {step === 'preview' ? '← Back' : '← New'} 
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step 1: Niche Input */}
        {step === 'input' && (
          <div className="text-center">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Turn Your Niche Into<br />
                <span className="text-emerald-600">Sellable Digital Products</span>
              </h2>
              <p className="text-gray-500 text-base max-w-md mx-auto">
                Enter any niche, get 5 product ideas, generate a complete PDF checklist or planner, and sell on Gumroad.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                What&apos;s your niche?
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}
                  placeholder="e.g., french learning, dog training, small garden..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loading || !niche.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${typeColors[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                          {idea.type}
                        </span>
                        <span className="text-xs text-gray-400">{idea.pageCount} pages</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{idea.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">👤 {idea.targetUser}</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {idea.features.slice(0, 3).map((f, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleSelectIdea(idea)}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
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
              <p className="text-sm text-gray-400 mt-2">Usually takes 20-40 seconds</p>
            </div>
          </div>
        )}

        {/* Step 4: Preview + Download */}
        {step === 'preview' && product && (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${typeColors[product.type]}`}>
                  {product.type}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{product.title}</h2>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">Preview</span>
              </div>
              <div 
                ref={previewRef}
                className="p-8 max-h-[500px] overflow-y-auto text-sm"
                style={{ fontFamily: 'Georgia, serif', lineHeight: 1.7 }}
              >
                <div className="max-w-none" dangerouslySetInnerHTML={{ 
                  __html: product.content
                    .replace(/^# (.+)$/gm, '<h1 style="font-size:20pt;font-weight:bold;color:#10B981;margin:25px 0 12px 0;">$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2 style="font-size:14pt;font-weight:600;color:#10B981;margin:20px 0 10px 0;padding-bottom:5px;border-bottom:1px solid #eee;">$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3 style="font-size:12pt;font-weight:600;color:#059669;margin:15px 0 8px 0;">$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;align-items:flex-start;margin:8px 0;"><span style="display:inline-block;width:16px;height:16px;border:2px solid #333;border-radius:3px;margin-right:10px;margin-top:3px;flex-shrink:0;"></span>$1</div>')
                    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;align-items:flex-start;margin:8px 0;"><span style="display:inline-block;width:16px;height:16px;background:#10B981;border:2px solid #10B981;border-radius:3px;margin-right:10px;margin-top:3px;flex-shrink:0;color:white;font-size:10px;line-height:14px;text-align:center;">✓</span>$1</div>')
                    .replace(/^- (.+)$/gm, '<li style="margin:5px 0 5px 20px;">$1</li>')
                    .replace(/^\d+\. (.+)$/gm, '<li style="margin:5px 0 5px 20px;list-style-type:decimal;">$1</li>')
                    .replace(/\n\n/g, '<p style="margin:10px 0;"></p>')
                    .replace(/\n/g, '<br>')
                }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 min-w-[160px] px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                📥 Download PDF
              </button>
              <button
                onClick={handleCopyContent}
                className="flex-1 min-w-[160px] px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                📋 Copy Content
              </button>
              <button
                onClick={() => selectedIdea && handleSelectIdea(selectedIdea)}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                🔄 Regenerate
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
