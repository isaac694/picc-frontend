'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { Loader2, Pencil, Plus, Power, PowerOff, Search, Trash2 } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [togglingFaqId, setTogglingFaqId] = useState<number | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQDraft>(EMPTY_DRAFT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState('');

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
    let cancelled = false;

    void (async () => {
      try {
        const response = await apiFetch('/api/faqs');
        if (cancelled) return;
        if (!response.ok) return;
        const data = await response.json();
        const list: FAQRecord[] = Array.isArray(data) ? data : [];
        setFaqs(list);
      } catch {
        if (!cancelled) setFaqs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingFaqId(null);
    setFaqDraft(EMPTY_DRAFT);
    setDialogStatus('');
  };

  const openAddDialog = () => {
    setEditingFaqId(null);
    setFaqDraft(EMPTY_DRAFT);
    setDialogStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (faq: FAQRecord) => {
    setEditingFaqId(faq.id);
    setFaqDraft({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
    });
    setDialogStatus('');
    setDialogOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      setDialogStatus('Please fill both question and answer.');
      return;
    }

    setDialogStatus('');
    setSaving(true);

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
        setDialogStatus(editingFaqId ? 'Unable to update FAQ.' : 'Unable to add FAQ.');
        return;
      }

      const wasEdit = Boolean(editingFaqId);
      await refreshFaqs();
      closeDialog();
      setStatus(wasEdit ? 'FAQ updated.' : 'FAQ added.');
    } catch {
      setDialogStatus(editingFaqId ? 'Unable to update FAQ.' : 'Unable to add FAQ.');
    } finally {
      setSaving(false);
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
      if (editingFaqId === faqId) closeDialog();
      setStatus('FAQ deleted.');
    } catch {
      setStatus('Unable to delete FAQ.');
    } finally {
      setDeletingFaqId(null);
    }
  };

  const requestDeleteFaq = (faq: FAQRecord) => {
    confirmDeleteToast({
      title: 'Delete this FAQ?',
      description: faq.question,
      onConfirm: () => void handleDeleteFaq(faq.id),
    });
  };

  const handleToggleFaqActive = async (faq: FAQRecord, isActive: boolean) => {
    setStatus('');
    setTogglingFaqId(faq.id);

    try {
      const response = await apiFetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: faq.question,
          answer: faq.answer,
          isActive,
        }),
      });

      if (!response.ok) {
        setStatus(isActive ? 'Unable to activate FAQ.' : 'Unable to deactivate FAQ.');
        return;
      }

      await refreshFaqs();
      if (editingFaqId === faq.id) {
        setFaqDraft((prev) => ({ ...prev, isActive }));
      }
      setStatus(isActive ? 'FAQ activated.' : 'FAQ deactivated.');
    } catch {
      setStatus(isActive ? 'Unable to activate FAQ.' : 'Unable to deactivate FAQ.');
    } finally {
      setTogglingFaqId(null);
    }
  };

  const isDialogError =
    Boolean(dialogStatus) &&
    (dialogStatus.includes('Unable') || dialogStatus.includes('Please'));

  const faqFormFields = (
    <div className="space-y-4">
      {dialogStatus ? (
        <div
          className={`rounded-xl p-3 text-sm ${
            isDialogError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {dialogStatus}
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Question</label>
        <input
          type="text"
          placeholder="e.g., What time are services?"
          value={faqDraft.question}
          onChange={(event) => setFaqDraft((prev) => ({ ...prev, question: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">Answer</label>
        <textarea
          placeholder="The answer to the question..."
          value={faqDraft.answer}
          onChange={(event) => setFaqDraft((prev) => ({ ...prev, answer: event.target.value }))}
          rows={6}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status ? (
        <div
          className={`rounded-xl p-4 text-sm ${status.includes('Unable') || status.includes('Please') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
        >
          {status}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">FAQs</h2>
        <Button type="button" onClick={openAddDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
            return;
          }
          closeDialog();
        }}
        title={editingFaqId ? 'Edit FAQ' : 'Add FAQ'}
        description={
          editingFaqId
            ? 'Update the question and answer. Use Deactivate on the list to hide it from the footer.'
            : 'Create a new question and answer for the site footer.'
        }
        saving={saving}
        saveLabel={editingFaqId ? 'Save changes' : 'Add FAQ'}
        onSave={() => void handleSaveFaq()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-2xl"
      >
        {faqFormFields}
      </SchoolAdminDialogShell>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-semibold text-foreground">Current FAQs</h3>
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
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <p className="text-sm text-foreground/60">
              {searchTerm ? 'No FAQs match your search.' : 'No FAQs added yet.'}
            </p>
            {!searchTerm ? (
              <Button type="button" onClick={openAddDialog} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="max-h-[620px] overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Question</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaqs.map((faq) => (
                  <tr key={faq.id} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{faq.question}</p>
                      <p className="mt-1 line-clamp-2 text-foreground/70">{faq.answer}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground/70">{faq.isActive ? 'Active' : 'Hidden'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {faq.isActive ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={togglingFaqId === faq.id}
                            onClick={() => void handleToggleFaqActive(faq, false)}
                          >
                            {togglingFaqId === faq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={togglingFaqId === faq.id}
                            onClick={() => void handleToggleFaqActive(faq, true)}
                          >
                            {togglingFaqId === faq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                            Activate
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit FAQ: ${faq.question}`}
                          onClick={() => openEditDialog(faq)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete FAQ: ${faq.question}`}
                          onClick={() => requestDeleteFaq(faq)}
                          disabled={deletingFaqId === faq.id}
                        >
                          {deletingFaqId === faq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
