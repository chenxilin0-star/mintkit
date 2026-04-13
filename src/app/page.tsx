'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProductIdea, ProductContent } from '@/lib/openai';
import { downloadPDF } from '@/lib/pdfGenerator';
import { TEMPLATE_OPTIONS, TemplateId, renderTemplate } from '@/lib/productTemplates';
import { addUserProduct } from '@/lib/userProducts';
import UpgradeModal from '@/components/UpgradeModal';
import Header from '@/components/Header';
import { Plan, buildUserPlanInfo, canDownload, canCopy } from '@/lib/subscription';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'download' | 'copy' | 'limit' | 'manual'>('manual');

  // Plan state
  const [userPlan, setUserPlan] = useState<Plan>('free');
  const [todayCount, setTodayCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);

  const { data: session, status } = useSession();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch user plan info
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/plan')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setUserPlan(data.plan || 'free');
            setTodayCount(data.todayCount || 0);
            setMonthlyCount(data.monthlyCount || 0);
          }
        })
        .catch(() => {});
    } else if (status === 'unauthenticated') {
      // Reset to free for non-logged-in users
      setUserPlan('free');
    }
  }, [status]);

  // Check sessionStorage for regenerate niche pre-fill
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const regenerateNiche = sessionStorage.getItem('mintkit_regenerate_niche');
      if (regenerateNiche) {
        setNiche(regenerateNiche);
        sessionStorage.removeItem('mintkit_regenerate_niche');
      }
    }
  }, []);

  const planInfo = buildUserPlanInfo(userPlan, todayCount, monthlyCount);

  // Check if user is over limit
  function checkGenerationLimit(): boolean {
    if (planInfo.isOverDailyLimit) {
      setUpgradeReason('limit');
      setShowUpgradeModal(true);
      return true;
    }
    return false;
  }

  async function handleGenerateIdeas() {
    if (!niche.trim()) return;

    if (status === 'unauthenticated') {
      signIn('google');
      return;
    }

    if (checkGenerationLimit()) return;

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
      // Don't increment todayCount here — generation is counted when product is confirmed
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
    if (checkGenerationLimit()) {
      setStep('ideas');
      return;
    }

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

      // Record generation in D1
      try {
        await fetch('/api/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche,
            productTitle: data.product.title,
            productType: data.product.type?.toLowerCase() || 'planner',
            templateId: selectedTemplate,
          }),
        });
      } catch {}

      // Save to localStorage for dashboard history
      addUserProduct({
        niche: niche,
        productTitle: data.product.title,
        productType: data.product.type,
        templateId: selectedTemplate,
      });

      setStep('preview');
      setTodayCount((c) => c + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to generate product');
      setStep('template');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!canDownload(userPlan)) {
      setUpgradeReason('download');
      setShowUpgradeModal(true);
      return;
    }
    if (!product) return;
    const filename = product.title.replace(/[^a-z0-9]/gi, '_');
    downloadPDF(product.content, filename, selectedTemplate);
  }

  function handleCopyContent() {
    if (!canCopy(userPlan)) {
      setUpgradeReason('copy');
      setShowUpgradeModal(true);
      return;
    }
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

  // Show upgrade modal for logged-out users clicking generate
  function handleUpgradeForLogin() {
    setUpgradeReason('manual');
    setShowUpgradeModal(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

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

            {/* Usage notice for free users */}
            {status === 'authenticated' && userPlan === 'free' && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>📅 {todayCount >= 1 ? '❌' : '✅'} {Math.max(0, 1 - todayCount)} generation left today</span>
                <button
                  onClick={() => { setUpgradeReason('manual'); setShowUpgradeModal(true); }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Upgrade for more →
                </button>
              </div>
            )}
            {status === 'authenticated' && userPlan === 'basic' && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>📅 {30 - monthlyCount} generations left this month</span>
                <button
                  onClick={() => { setUpgradeReason('manual'); setShowUpgradeModal(true); }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Upgrade to Premium →
                </button>
              </div>
            )}

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
                  disabled={loading || !niche.trim() || (planInfo.isOverDailyLimit && status === 'authenticated')}
                  className="px-6 py-3 min-h-[44px] bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Generating...
                    </span>
                  ) : status === 'unauthenticated' ? 'Sign in to Generate' : 'Generate Ideas'}
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

            {/* Generation counter */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {userPlan === 'premium'
                  ? '∞ Unlimited generations'
                  : userPlan === 'basic'
                    ? `${Math.max(0, 30 - monthlyCount)} generations left this month`
                    : `${Math.max(0, 1 - todayCount)}/1 generation left today`}
              </p>
              {(userPlan === 'free' && planInfo.isOverDailyLimit) || (userPlan === 'basic' && planInfo.isOverMonthlyLimit) ? (
                <button
                  onClick={() => { setUpgradeReason('limit'); setShowUpgradeModal(true); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Upgrade for more →
                </button>
              ) : (
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
              {/* Download PDF */}
              {canDownload(userPlan) ? (
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  📥 Download PDF
                </button>
              ) : (
                <button
                  onClick={() => { setUpgradeReason('download'); setShowUpgradeModal(true); }}
                  className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-gray-200 text-gray-500 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  title="Upgrade to download"
                >
                  📥 Download PDF
                  <span className="text-xs bg-gray-300 px-1.5 py-0.5 rounded">Basic+</span>
                </button>
              )}

              {/* Copy Content */}
              {canCopy(userPlan) ? (
                <button
                  onClick={handleCopyContent}
                  className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  📋 Copy Content
                </button>
              ) : (
                <button
                  onClick={() => { setUpgradeReason('copy'); setShowUpgradeModal(true); }}
                  className="flex-1 min-w-[160px] min-h-[44px] px-6 py-3 bg-gray-200 text-gray-500 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  title="Upgrade to copy"
                >
                  📋 Copy Content
                  <span className="text-xs bg-gray-300 px-1.5 py-0.5 rounded">Basic+</span>
                </button>
              )}
            </div>

            {/* Upgrade nudge for free users */}
            {!canDownload(userPlan) && !canCopy(userPlan) && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm text-amber-700 mb-2">
                  💡 Upgrade to Basic or Premium to download PDFs and copy content
                </p>
                <button
                  onClick={() => { setUpgradeReason('manual'); setShowUpgradeModal(true); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  View Plans →
                </button>
              </div>
            )}

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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
        reason={upgradeReason}
        todayCount={todayCount}
        monthlyCount={monthlyCount}
      />

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center space-y-3">
          <div className="text-sm text-gray-400">
            Built with MintKit · <a href="/pricing" className="hover:text-emerald-600">Pricing</a> · <a href="/faq" className="hover:text-emerald-600">FAQ</a> · Start selling your digital products today
          </div>
          <div className="flex gap-4 text-sm text-gray-400 justify-center">
            <a href="/terms-and-conditions" className="hover:text-gray-600 transition-colors">Terms & Conditions</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
