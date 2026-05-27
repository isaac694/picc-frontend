'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type FAQRecord = {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
};

type FAQDraft = {
  question: string;
  answer: string;
  isActive: boolean;
};

const EMPTY_DRAFT: FAQDraft = {
  question: '',
  answer: '',
  isActive: true,
};

export default function FAQManager({
  token,
}: {
  token: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingFaqId, setSavingFaqId] = useState<number | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQDraft>(EMPTY_DRAFT);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return faqs;
    const lowerSearch = searchTerm.toLowerCase();

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerSearch) ||
        faq.answer.toLowerCase().includes(lowerSearch),
    );
  }, [faqs, searchTerm]);

  const refreshFaqs = async () => {
    try {
      const response = await apiFetch('/api/faqs');
      if (!response.ok) return;
      const data = await response.json();
      const list: FAQRecord[] = Array.isArray(data) ? data : [];
      setFaqs(list);
    } catch {
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFaqs();
  }, []);

  const resetEditor = () => {
    setEditingFaqId(null);
    setFaqDraft(EMPTY_DRAFT);
  };

  const startEditingFaq = (faq: FAQRecord) => {
    setEditingFaqId(faq.id);
    setFaqDraft({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
    });
    setStatus('');
  };

  const handleSaveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      setStatus('Please fill both question and answer.');
      return;
    }

    setStatus('');
    setSavingFaqId(editingFaqId ?? 0);

    try {
      const response = await apiFetch(editingFaqId ? `/api/faqs/${editingFaqId}` : '/api/faqs', {
        method: editingFaqId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqDraft),
      });

      if (!response.ok) {
        setStatus(editingFaqId ? 'Unable to update FAQ.' : 'Unable to add FAQ.');
        return;
      }

      await refreshFaqs();
      resetEditor();
      setStatus(editingFaqId ? 'FAQ updated.' : 'FAQ added.');
    } catch {
      setStatus(editingFaqId ? 'Unable to update FAQ.' : 'Unable to add FAQ.');
    } finally {
      setSavingFaqId(null);
    }
  };

  const handleDeleteFaq = async (faqId: number) => {
    setStatus('');
    setDeletingFaqId(faqId);

    try {
      const response = await apiFetch(`/api/faqs/${faqId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setStatus('Unable to delete FAQ.');
        return;
      }

      await refreshFaqs();
      if (editingFaqId === faqId) {
        resetEditor();
      }
      setStatus('FAQ deleted.');
    } catch {
      setStatus('Unable to delete FAQ.');
    } finally {
      setDeletingFaqId(null);
    }
  };

  const requestDeleteFaq = (faq: FAQRecord) => {
    const toastId = toast('Delete this FAQ?', {
      description: faq.question,
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void handleDeleteFaq(faq.id);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status && (
        <div className={`rounded-xl p-4 text-sm ${status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Plus className="h-5 w-5" />
              {editingFaqId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            {editingFaqId && (
              <Button variant="outline" onClick={resetEditor}>
                New FAQ
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                Question
              </label>
              <input
                type="text"
                placeholder="e.g., What time are services?"
                value={faqDraft.question}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, question: event.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                Answer
              </label>
              <textarea
                placeholder="The answer to the question..."
                value={faqDraft.answer}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, answer: event.target.value }))
                }
                rows={6}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={faqDraft.isActive}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                className="rounded border-border"
              />
              <span>Show this FAQ in the footer</span>
            </label>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveFaq} disabled={savingFaqId !== null}>
                {savingFaqId !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingFaqId ? 'Saving...' : 'Adding...'}
                  </>
                ) : editingFaqId ? (
                  'Save FAQ'
                ) : (
                  'Add FAQ'
                )}
              </Button>
              <Button variant="outline" onClick={resetEditor}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Current FAQs
            </h2>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="rounded-xl border border-border/60 border-dashed py-12 text-center">
              <p className="text-sm text-foreground/60">
                {searchTerm ? 'No FAQs match your search.' : 'No FAQs added yet.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-xl border p-4 transition ${
                    editingFaqId === faq.id
                      ? 'border-primary/60 bg-primary/5'
                      : 'border-border/60 bg-background'
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {faq.question}
                  </p>
                  <p className="mt-2 text-sm text-foreground/70">
                    {faq.answer}
                  </p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                    {faq.isActive ? 'Active' : 'Hidden'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditingFaq(faq)}>
                      {editingFaqId === faq.id ? 'Editing' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => requestDeleteFaq(faq)}
                      disabled={deletingFaqId === faq.id}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      {deletingFaqId === faq.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
