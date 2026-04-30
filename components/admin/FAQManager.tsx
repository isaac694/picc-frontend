'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Save, GripVertical } from 'lucide-react';

export type FAQRecord = {
  id: number;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

type FAQDraft = {
  question: string;
  answer: string;
  order: number;
};

export default function FAQManager({
  token,
}: {
  token: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQRecord[]>([]);
  const savedSnapshotRef = useRef<Record<number, string>>({});
  const [savingFaqId, setSavingFaqId] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQDraft>({
    question: '',
    answer: '',
    order: 0,
  });

  const snapshot = useMemo(
    () => (faq: FAQRecord) =>
      JSON.stringify({
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
      }),
    [],
  );

  const isDirty = useMemo(
    () => (faq: FAQRecord) => savedSnapshotRef.current[faq.id] !== snapshot(faq),
    [snapshot],
  );

  const refreshFaqs = async () => {
    try {
      const response = await apiFetch('/api/faqs');
      if (!response.ok) return;
      const data = await response.json();
      const list: FAQRecord[] = Array.isArray(data) ? data : [];
      setFaqs(list);
      savedSnapshotRef.current = Object.fromEntries(list.map((item) => [item.id, snapshot(item)]));
    } catch {
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFaqs();
  }, []);

  const handleAddFaq = async () => {
    if (!faqDraft.question || !faqDraft.answer) {
      setStatus('Please fill both question and answer.');
      return;
    }

    setStatus('');
    try {
      const response = await apiFetch('/api/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqDraft),
      });

      if (!response.ok) {
        setStatus('Unable to add FAQ.');
        return;
      }

      setFaqDraft({
        question: '',
        answer: '',
        order: faqs.length + 1,
      });
      await refreshFaqs();
      setStatus('FAQ added.');
    } catch {
      setStatus('Unable to add FAQ.');
    }
  };

  const handleUpdateFaq = async (faq: FAQRecord) => {
    setStatus('');
    setSavingFaqId(faq.id);
    try {
      const response = await apiFetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faq),
      });
      if (!response.ok) {
        setStatus('Unable to update FAQ.');
        return;
      }
      await refreshFaqs();
      setStatus('FAQ updated.');
    } catch {
      setStatus('Unable to update FAQ.');
    } finally {
      setSavingFaqId(null);
    }
  };

  const handleDeleteFaq = async (faqId: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    setStatus('');
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
      setStatus('FAQ deleted.');
    } catch {
      setStatus('Unable to delete FAQ.');
    }
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
        <div className={`p-4 rounded-xl text-sm ${status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New FAQ
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">Question</label>
              <input
                type="text"
                placeholder="e.g., What time are services?"
                value={faqDraft.question}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, question: event.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">Answer</label>
              <textarea
                placeholder="The answer to the question..."
                value={faqDraft.answer}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, answer: event.target.value }))
                }
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">Display Order</label>
              <input
                type="number"
                value={faqDraft.order}
                onChange={(event) =>
                  setFaqDraft((prev) => ({ ...prev, order: parseInt(event.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <Button onClick={handleAddFaq} className="w-full md:w-auto">Add FAQ</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current FAQs
          </h2>
          {faqs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
              <p className="text-sm text-foreground/60">No FAQs added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-xl border border-border/60 bg-background p-4 space-y-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-3 text-foreground/20 group-hover:text-foreground/40 transition">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(event) =>
                          setFaqs((prev) =>
                            prev.map((item) =>
                              item.id === faq.id ? { ...item, question: event.target.value } : item,
                            ),
                          )
                        }
                        className="w-full font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition px-1 py-1"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(event) =>
                          setFaqs((prev) =>
                            prev.map((item) =>
                              item.id === faq.id ? { ...item, answer: event.target.value } : item,
                            ),
                          )
                        }
                        rows={3}
                        className="w-full text-sm text-foreground/70 bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none transition rounded-lg px-2 py-2"
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-foreground/40">Order:</span>
                          <input
                            type="number"
                            value={faq.order}
                            onChange={(event) =>
                              setFaqs((prev) =>
                                prev.map((item) =>
                                  item.id === faq.id ? { ...item, order: parseInt(event.target.value) || 0 } : item,
                                ),
                              )
                            }
                            className="w-16 text-xs bg-muted/50 rounded-lg px-2 py-1 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={faq.isActive}
                            onChange={(event) =>
                              setFaqs((prev) =>
                                prev.map((item) =>
                                  item.id === faq.id ? { ...item, isActive: event.target.checked } : item,
                                ),
                              )
                            }
                            className="rounded border-border"
                          />
                          <span className="text-[10px] uppercase font-bold text-foreground/40">Active</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {isDirty(faq) ? (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateFaq(faq)}
                            className="h-8 gap-1"
                            disabled={savingFaqId === faq.id}
                          >
                            {savingFaqId === faq.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 gap-1" disabled>
                            Saved
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
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
