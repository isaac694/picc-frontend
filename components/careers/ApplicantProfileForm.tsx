'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  EDUCATION_LEVELS,
  emptyEducation,
  emptyReferee,
  emptyWorkExperience,
  type ApplicantEducation,
  type ApplicantFieldErrors,
  type ApplicantProfileFields,
  type ApplicantReferee,
  type ApplicantWorkExperience,
  type EducationLevel,
} from '@/lib/hr-applicant';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';

type ApplicantProfileFormProps = {
  value: ApplicantProfileFields;
  onChange: (next: ApplicantProfileFields) => void;
  errors?: ApplicantFieldErrors;
};

export default function ApplicantProfileForm({ value, onChange, errors = {} }: ApplicantProfileFormProps) {
  const [skillDraft, setSkillDraft] = useState('');

  const addSkill = () => {
    const next = skillDraft.trim();
    if (!next) return;
    const exists = value.skills.some((skill) => skill.toLowerCase() === next.toLowerCase());
    if (exists) {
      setSkillDraft('');
      return;
    }
    onChange({ ...value, skills: [...value.skills, next] });
    setSkillDraft('');
  };

  const removeSkill = (skill: string) => {
    onChange({ ...value, skills: value.skills.filter((item) => item !== skill) });
  };

  const updateWork = (id: string | undefined, patch: Partial<ApplicantWorkExperience>) => {
    onChange({
      ...value,
      workExperience: value.workExperience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const updateEducation = (id: string | undefined, patch: Partial<ApplicantEducation>) => {
    onChange({
      ...value,
      education: value.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const updateReferee = (id: string | undefined, patch: Partial<ApplicantReferee>) => {
    onChange({
      ...value,
      referees: value.referees.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Describe Yourself</h3>
          <p className="text-sm text-slate-600">
            Share your professional background, strengths, career objectives, and qualifications.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-summary">Personal Summary *</Label>
          <Textarea
            id="personal-summary"
            rows={6}
            value={value.personalSummary}
            aria-invalid={Boolean(errors.personalSummary)}
            onChange={(event) => onChange({ ...value, personalSummary: event.target.value })}
            placeholder={examplePlaceholder('I am a communications professional with 5 years of experience in media relations.')}
          />
          <FieldError message={errors.personalSummary} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">Location</h3>
          <p className="text-sm text-slate-600">Where you live now and your full postal or residential address.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current-location">Current location *</Label>
            <Input
              id="current-location"
              value={value.currentLocation}
              aria-invalid={Boolean(errors.currentLocation)}
              onChange={(event) => onChange({ ...value, currentLocation: event.target.value })}
              placeholder={examplePlaceholder('Lilongwe, Malawi')}
            />
            <FieldError message={errors.currentLocation} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={value.address}
              aria-invalid={Boolean(errors.address)}
              onChange={(event) => onChange({ ...value, address: event.target.value })}
              placeholder={examplePlaceholder('Area 25, Sector 3, Lilongwe')}
            />
            <FieldError message={errors.address} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Achievements</h3>
          <p className="text-sm text-slate-600">
            Awards, recognitions, notable projects, or other highlights you want the hiring team to see.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="achievements">Achievements</Label>
          <Textarea
            id="achievements"
            rows={5}
            value={value.achievements}
            aria-invalid={Boolean(errors.achievements)}
            onChange={(event) => onChange({ ...value, achievements: event.target.value })}
            placeholder={examplePlaceholder(
              'Led a regional communications campaign in 2024.\nVolunteer coordinator for youth outreach programs.',
            )}
          />
          <FieldError message={errors.achievements} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Skills</h3>
          <p className="text-sm text-slate-600">Add professional and technical skills. Empty or duplicate skills are not saved.</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={skillDraft}
            onChange={(event) => setSkillDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSkill();
              }
            }}
            placeholder={examplePlaceholder('Copywriting')}
            aria-invalid={Boolean(errors.skills)}
          />
          <Button type="button" variant="outline" onClick={addSkill}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <FieldError message={errors.skills} />
        {value.skills.length ? (
          <div className="flex flex-wrap gap-2">
            {value.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="gap-1 pr-1">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills added yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Work Experience</h3>
            <p className="text-sm text-slate-600">Add previous roles, with the most recent experience first.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...value, workExperience: [emptyWorkExperience(), ...value.workExperience] })}
          >
            <Plus className="h-4 w-4" />
            Add experience
          </Button>
        </div>
        {value.workExperience.length ? (
          <div className="space-y-4">
            {value.workExperience.map((item, index) => (
              <div key={item.id || index} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Experience {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({
                      ...value,
                      workExperience: value.workExperience.filter((entry) => entry.id !== item.id),
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Previous Employer *</Label>
                  <Input
                    value={item.employer}
                    aria-invalid={Boolean(errors[`work.${item.id}.employer`])}
                    onChange={(event) => updateWork(item.id, { employer: event.target.value })}
                    placeholder={examplePlaceholder('PICC')}
                  />
                  <FieldError message={errors[`work.${item.id}.employer`]} />
                </div>
                <div className="space-y-2">
                  <Label>Job Description *</Label>
                  <Textarea
                    rows={4}
                    value={item.jobDescription}
                    aria-invalid={Boolean(errors[`work.${item.id}.jobDescription`])}
                    onChange={(event) => updateWork(item.id, { jobDescription: event.target.value })}
                    placeholder={examplePlaceholder('Prepared reports and coordinated communications.')}
                  />
                  <FieldError message={errors[`work.${item.id}.jobDescription`]} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={item.startDate}
                      aria-invalid={Boolean(errors[`work.${item.id}.startDate`])}
                      onChange={(event) => updateWork(item.id, { startDate: event.target.value })}
                    />
                    <FieldError message={errors[`work.${item.id}.startDate`]} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date {item.currentlyWorking ? '' : '*'}</Label>
                    <Input
                      type="date"
                      value={item.endDate || ''}
                      disabled={item.currentlyWorking}
                      aria-invalid={Boolean(errors[`work.${item.id}.endDate`])}
                      onChange={(event) => updateWork(item.id, { endDate: event.target.value })}
                    />
                    <FieldError message={errors[`work.${item.id}.endDate`]} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(item.currentlyWorking)}
                    onCheckedChange={(checked) => updateWork(item.id, {
                      currentlyWorking: Boolean(checked),
                      endDate: checked ? '' : item.endDate,
                    })}
                  />
                  Currently working here
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
            No work experience added yet.
          </p>
        )}
        <FieldError message={errors.workExperience} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Education</h3>
            <p className="text-sm text-slate-600">Record your educational background.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...value, education: [emptyEducation(), ...value.education] })}
          >
            <Plus className="h-4 w-4" />
            Add education
          </Button>
        </div>
        {value.education.length ? (
          <div className="space-y-4">
            {value.education.map((item, index) => (
              <div key={item.id || index} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Education {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({
                      ...value,
                      education: value.education.filter((entry) => entry.id !== item.id),
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input
                    value={item.schoolName}
                    aria-invalid={Boolean(errors[`edu.${item.id}.schoolName`])}
                    onChange={(event) => updateEducation(item.id, { schoolName: event.target.value })}
                    placeholder={examplePlaceholder('Name of the school')}
                  />
                  <FieldError message={errors[`edu.${item.id}.schoolName`]} />
                </div>
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-invalid:border-destructive"
                    value={item.level}
                    aria-invalid={Boolean(errors[`edu.${item.id}.level`])}
                    onChange={(event) => {
                      const level = event.target.value as EducationLevel | '';
                      updateEducation(item.id, {
                        level,
                        programOfStudy: level === 'TERTIARY_EDUCATION' ? item.programOfStudy || '' : '',
                      });
                    }}
                  >
                    <option value="">Select level</option>
                    {EDUCATION_LEVELS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <FieldError message={errors[`edu.${item.id}.level`]} />
                </div>
                {item.level === 'TERTIARY_EDUCATION' ? (
                  <div className="space-y-2">
                    <Label>Program of study *</Label>
                    <Input
                      value={item.programOfStudy || ''}
                      aria-invalid={Boolean(errors[`edu.${item.id}.programOfStudy`])}
                      onChange={(event) => updateEducation(item.id, { programOfStudy: event.target.value })}
                      placeholder={examplePlaceholder('Bachelor of Arts in Communication')}
                    />
                    <FieldError message={errors[`edu.${item.id}.programOfStudy`]} />
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={item.startDate}
                      aria-invalid={Boolean(errors[`edu.${item.id}.startDate`])}
                      onChange={(event) => updateEducation(item.id, { startDate: event.target.value })}
                    />
                    <FieldError message={errors[`edu.${item.id}.startDate`]} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={item.endDate || ''}
                      aria-invalid={Boolean(errors[`edu.${item.id}.endDate`])}
                      onChange={(event) => updateEducation(item.id, { endDate: event.target.value })}
                    />
                    <FieldError message={errors[`edu.${item.id}.endDate`]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
            No education records added yet.
          </p>
        )}
        <FieldError message={errors.education} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Referees</h3>
            <p className="text-sm text-slate-600">Provide at least three professional references with contact details.</p>
          </div>
          <Button                                                                                                                                                          
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...value, referees: [...value.referees, emptyReferee()] })}
          >
            <Plus className="h-4 w-4" />
            Add referee
          </Button>
        </div>
        {value.referees.length ? (
          <div className="space-y-4">
            {value.referees.map((item, index) => (
              <div key={item.id || index} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Referee {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={value.referees.length <= 2}
                    onClick={() => onChange({
                      ...value,
                      referees: value.referees.filter((entry) => entry.id !== item.id),
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full name *</Label>
                    <Input
                      value={item.name}
                      aria-invalid={Boolean(errors[`ref.${item.id}.name`])}
                      onChange={(event) => updateReferee(item.id, { name: event.target.value })}
                      placeholder={examplePlaceholder('John Phiri')}
                    />
                    <FieldError message={errors[`ref.${item.id}.name`]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Position *</Label>
                    <Input
                      value={item.position}
                      aria-invalid={Boolean(errors[`ref.${item.id}.position`])}
                      onChange={(event) => updateReferee(item.id, { position: event.target.value })}
                      placeholder={examplePlaceholder('HR Manager')}
                    />
                    <FieldError message={errors[`ref.${item.id}.position`]} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={item.company}
                    aria-invalid={Boolean(errors[`ref.${item.id}.company`])}
                    onChange={(event) => updateReferee(item.id, { company: event.target.value })}
                    placeholder={examplePlaceholder('ABC Ltd')}
                  />
                  <FieldError message={errors[`ref.${item.id}.company`]} />
                </div>
                <div className="space-y-2">
                  <Label>Contact details *</Label>
                  <Input
                    value={item.contactDetails}
                    aria-invalid={Boolean(errors[`ref.${item.id}.contactDetails`])}
                    onChange={(event) => updateReferee(item.id, { contactDetails: event.target.value })}
                    placeholder={examplePlaceholder('+265 999 000 000 / john@abc.mw')}
                  />
                  <FieldError message={errors[`ref.${item.id}.contactDetails`]} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
            No referees added yet. Add at least two references.
          </p>
        )}
        <FieldError message={errors.referees} />
      </section>
    </div>
  );
}
