'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  catalogCategory,
  newField,
  newSection,
  slugifyKey,
  type PortalConfig,
  type PortalField,
  type PortalFieldCatalogItem,
  type PortalSection,
} from '@/lib/hr-portal';

type VacancyPortalBuilderProps = {
  value: PortalConfig;
  fieldTypes: PortalFieldCatalogItem[];
  onChange: (value: PortalConfig) => void;
};

const joinLines = (items?: string[]) => (items || []).join('\n');
const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export default function VacancyPortalBuilder({ value, fieldTypes, onChange }: VacancyPortalBuilderProps) {
  const sections = value.sections || [];

  const setSections = (next: PortalSection[]) => onChange({ ...value, version: value.version || 1, sections: next });

  const updateSection = (index: number, patch: Partial<PortalSection>) => {
    setSections(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  };

  const updateField = (sectionIndex: number, fieldIndex: number, patch: Partial<PortalField>) => {
    const section = sections[sectionIndex];
    const fields = (section.fields || []).map((field, i) => (i === fieldIndex ? { ...field, ...patch } : field));
    updateSection(sectionIndex, { fields });
  };

  return (
    <div className="md:col-span-2 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Applicant Portal Builder</h3>
          <p className="text-sm text-muted-foreground">Add sections, questions, lists, and file uploads shown to applicants.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSections([...sections, newSection('content')])}>
            <Plus className="h-4 w-4" /> Content
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSections([...sections, newSection('form')])}>
            <Plus className="h-4 w-4" /> Form
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSections([...sections, newSection('attachments')])}>
            <Plus className="h-4 w-4" /> Attachments
          </Button>
        </div>
      </div>

      {sections.map((section, sectionIndex) => (
        <div key={section.id || sectionIndex} className="rounded-xl border border-border p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <div className="space-y-2">
              <Label>Section title</Label>
              <Input value={section.title || ''} onChange={(event) => updateSection(sectionIndex, { title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Section type</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={section.type || 'content'}
                onChange={(event) => updateSection(sectionIndex, { type: event.target.value })}
              >
                <option value="content">Content</option>
                <option value="form">Form</option>
                <option value="attachments">Attachments</option>
              </select>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="self-end"
              onClick={() => setSections(sections.filter((_, i) => i !== sectionIndex))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Section description</Label>
            <Input value={section.description || ''} onChange={(event) => updateSection(sectionIndex, { description: event.target.value })} />
          </div>

          <div className="space-y-3">
            {(section.fields || []).map((field, fieldIndex) => {
              const type = field.widget || field.type || 'text';
              const category = catalogCategory(type);
              return (
                <div key={`${section.id}-${field.key || fieldIndex}`} className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
                  <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
                    <select
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                      value={type}
                      onChange={(event) => {
                        const next = newField(event.target.value, field.label);
                        updateField(sectionIndex, fieldIndex, { ...field, ...next, label: field.label || next.label, key: field.key || next.key });
                      }}
                    >
                      {fieldTypes.map((item) => (
                        <option key={item.type} value={item.type}>{item.label}</option>
                      ))}
                    </select>
                    <Input
                      value={field.label || ''}
                      placeholder="Field label"
                      onChange={(event) => {
                        const label = event.target.value;
                        updateField(sectionIndex, fieldIndex, {
                          label,
                          key: category === 'display' ? field.key : field.key || slugifyKey(label),
                        });
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => updateSection(sectionIndex, { fields: (section.fields || []).filter((_, i) => i !== fieldIndex) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {category !== 'display' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Field key</Label>
                        <Input value={field.key || ''} onChange={(event) => updateField(sectionIndex, fieldIndex, { key: slugifyKey(event.target.value || field.label || 'field') })} />
                      </div>
                      <label className="mt-7 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(event) => updateField(sectionIndex, fieldIndex, { required: event.target.checked })}
                        />
                        Required
                      </label>
                    </div>
                  ) : null}

                  {type === 'content' || type === 'html' ? (
                    <Textarea rows={4} value={field.content || ''} placeholder="Content shown to applicants" onChange={(event) => updateField(sectionIndex, fieldIndex, { content: event.target.value })} />
                  ) : null}

                  {type === 'list' ? (
                    <Textarea rows={4} value={joinLines(field.items)} placeholder="One item per line" onChange={(event) => updateField(sectionIndex, fieldIndex, { items: splitLines(event.target.value) })} />
                  ) : null}

                  {['select', 'radio', 'checkbox'].includes(type) ? (
                    <Textarea rows={3} value={joinLines((field.options || []).map((option) => typeof option === 'string' ? option : option.label || option.value || ''))} placeholder="One option per line" onChange={(event) => updateField(sectionIndex, fieldIndex, { options: splitLines(event.target.value) })} />
                  ) : null}

                  {category === 'file' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Accepted types</Label>
                        <Input value={(field.accept || []).join(', ')} placeholder=".pdf, .doc, .jpg" onChange={(event) => updateField(sectionIndex, fieldIndex, { accept: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max size (MB)</Label>
                        <Input type="number" min={1} value={field.maxSizeMb || 5} onChange={(event) => updateField(sectionIndex, fieldIndex, { maxSizeMb: Number(event.target.value) || 5 })} />
                      </div>
                    </div>
                  ) : null}

                  {category === 'input' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="Placeholder" value={field.placeholder || ''} onChange={(event) => updateField(sectionIndex, fieldIndex, { placeholder: event.target.value })} />
                      <Input placeholder="Help text" value={field.helpText || ''} onChange={(event) => updateField(sectionIndex, fieldIndex, { helpText: event.target.value })} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultType = section.type === 'attachments' ? 'file' : section.type === 'content' ? 'content' : 'text';
              updateSection(sectionIndex, { fields: [...(section.fields || []), newField(defaultType)] });
            }}
          >
            <Plus className="h-4 w-4" /> Add field
          </Button>
        </div>
      ))}
    </div>
  );
}
