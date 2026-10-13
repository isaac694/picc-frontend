export const APPLICANT_TOKEN_KEY = 'hr_applicant_token';
export const APPLICANT_KEY = 'hr_applicant';

export const EDUCATION_LEVELS = [
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'TERTIARY_EDUCATION', label: 'Tertiary Education' },
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]['value'];

export type ApplicantWorkExperience = {
  id?: string;
  employer: string;
  jobDescription: string;
  startDate: string;
  endDate?: string;
  currentlyWorking?: boolean;
};

export type ApplicantEducation = {
  id?: string;
  schoolName: string;
  level: EducationLevel | '';
  levelLabel?: string;
  programOfStudy?: string;
  startDate: string;
  endDate?: string;
};

export type ApplicantReferee = {
  id?: string;
  name: string;
  position: string;
  company: string;
  contactDetails: string;
};

export type ApplicantProfileFields = {
  personalSummary: string;
  currentLocation: string;
  address: string;
  skills: string[];
  workExperience: ApplicantWorkExperience[];
  education: ApplicantEducation[];
  referees: ApplicantReferee[];
};

export type ApplicantRecord = {
  id?: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
  phone?: string;
  personalSummary?: string;
  currentLocation?: string;
  address?: string;
  skills?: string[];
  workExperience?: ApplicantWorkExperience[];
  education?: ApplicantEducation[];
  referees?: ApplicantReferee[];
};

const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const emptyWorkExperience = (): ApplicantWorkExperience => ({
  id: newId('work'),
  employer: '',
  jobDescription: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
});

export const emptyEducation = (): ApplicantEducation => ({
  id: newId('edu'),
  schoolName: '',
  level: '',
  programOfStudy: '',
  startDate: '',
  endDate: '',
});

export const emptyReferee = (): ApplicantReferee => ({
  id: newId('ref'),
  name: '',
  position: '',
  company: '',
  contactDetails: '',
});

export const emptyApplicantProfile = (): ApplicantProfileFields => ({
  personalSummary: '',
  currentLocation: '',
  address: '',
  skills: [],
  workExperience: [],
  education: [],
  referees: [emptyReferee(), emptyReferee()],
});

const normalizeEducationLevel = (raw?: string): EducationLevel | '' => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const rawLevel = trimmed.toUpperCase().replaceAll(' ', '_').replaceAll('-', '_');
  if (EDUCATION_LEVELS.some((option) => option.value === rawLevel)) {
    return rawLevel as EducationLevel;
  }

  const compact = trimmed.toLowerCase();
  if (
    ['HIGH_SCHOOL', 'HIGHSCHOOL', 'SECONDARY_SCHOOL', 'SECONDARYSCHOOL', 'SECONDARY', 'SECONDARY_EDUCATION'].includes(rawLevel)
    || compact === 'high school'
    || compact === 'secondary school'
    || compact === 'secondary education'
  ) {
    return 'HIGH_SCHOOL';
  }

  if (
    ['TERTIARY_EDUCATION', 'TERTIARY', 'COLLEGE'].includes(rawLevel)
    || compact === 'tertiary education'
    || compact === 'college'
    || compact === 'tertiary'
  ) {
    return 'TERTIARY_EDUCATION';
  }

  return '';
};

export const educationLevelLabel = (level?: string) => {
  const normalized = normalizeEducationLevel(level);
  if (normalized) {
    return EDUCATION_LEVELS.find((item) => item.value === normalized)?.label || normalized.replaceAll('_', ' ');
  }
  return String(level || '').replaceAll('_', ' ');
};

export const isTertiaryEducation = (level?: string) => normalizeEducationLevel(level) === 'TERTIARY_EDUCATION';

export const formatProgramOfStudy = (value?: string | null) => {
  const text = String(value ?? '').trim();
  return text || 'Not provided';
};

export const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseSkills = (value: unknown): string[] => {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,|\n]/)
      : [];
  const seen = new Set<string>();
  return source
    .map((item) => String(item || '').trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseWorkExperience = (value: unknown): ApplicantWorkExperience[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => {
      if (!isRecord(item)) return null;
      const employer = String(item.employer || item.previousEmployer || item.company || '').trim();
      const jobDescription = String(item.jobDescription || item.description || '').trim();
      const startDate = toDateInput(typeof item.startDate === 'string' ? item.startDate : null);
      const currentlyWorking = Boolean(item.currentlyWorking || item.current);
      const endDate = currentlyWorking ? '' : toDateInput(typeof item.endDate === 'string' ? item.endDate : null);
      if (!employer && !jobDescription && !startDate && !endDate) return null;
      return {
        id: String(item.id || newId('work')),
        employer,
        jobDescription,
        startDate,
        endDate,
        currentlyWorking,
      } satisfies ApplicantWorkExperience;
    })
    .filter((item): item is ApplicantWorkExperience => Boolean(item));

const parseEducation = (value: unknown): ApplicantEducation[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => {
      if (!isRecord(item)) return null;
      const level = normalizeEducationLevel(typeof item.level === 'string' ? item.level : '');
      const schoolName = String(item.schoolName || item.school || item.institution || item.name || '').trim();
      const startDate = toDateInput(typeof item.startDate === 'string' ? item.startDate : null);
      const endDate = toDateInput(typeof item.endDate === 'string' ? item.endDate : null);
      const programOfStudy = String(
        item.programOfStudy ?? item.program ?? item.fieldOfStudy ?? item.course ?? item.degree ?? '',
      ).trim();
      if (!schoolName && !level && !startDate && !endDate && !programOfStudy) return null;
      return {
        id: String(item.id || newId('edu')),
        schoolName,
        level,
        levelLabel: String(item.levelLabel || '').trim() || educationLevelLabel(level),
        programOfStudy,
        startDate,
        endDate,
      } satisfies ApplicantEducation;
    })
    .filter((item): item is ApplicantEducation => Boolean(item));

const parseReferees = (value: unknown): ApplicantReferee[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => {
      if (!isRecord(item)) return null;
      const name = String(item.name || item.fullName || '').trim();
      const position = String(item.position || item.title || item.role || '').trim();
      const company = String(item.company || item.organization || item.employer || '').trim();
      const contactDetails = String(
        item.contactDetails || item.contact || item.phone || item.email || item.contactInfo || '',
      ).trim();
      if (!name && !position && !company && !contactDetails) return null;
      return {
        id: String(item.id || newId('ref')),
        name,
        position,
        company,
        contactDetails,
      } satisfies ApplicantReferee;
    })
    .filter((item): item is ApplicantReferee => Boolean(item));

export function extractApplicantProfile(value: unknown): ApplicantProfileFields {
  const record = isRecord(value) ? value : {};
  const nested = [record.application, record.profile, record.applicant, record.data]
    .filter(isRecord);
  const sources = [record, ...nested];

  const pickText = (...keys: string[]) => {
    for (const key of keys) {
      for (const source of sources) {
        const raw = source[key];
        if (raw == null) continue;
        const text = String(raw).trim();
        if (text) return text;
      }
    }
    return '';
  };

  const pickArray = (...keys: string[]) => {
    let best: unknown[] = [];
    for (const key of keys) {
      for (const source of sources) {
        const value = source[key];
        if (Array.isArray(value) && value.length > best.length) best = value;
      }
    }
    return best;
  };

  return {
    personalSummary: pickText('personalSummary', 'summary'),
    currentLocation: pickText('currentLocation', 'location', 'current_location', 'city'),
    address: pickText('address', 'homeAddress', 'home_address', 'residentialAddress'),
    skills: parseSkills(pickArray('skills')),
    workExperience: parseWorkExperience(pickArray('workExperience', 'experience')).sort((a, b) =>
      String(b.startDate || '').localeCompare(String(a.startDate || '')),
    ),
    education: parseEducation(pickArray('education')),
    referees: parseReferees(pickArray('referees', 'references')),
  };
}

export function serializeApplicantProfile(profile: ApplicantProfileFields) {
  return {
    personalSummary: profile.personalSummary.trim(),
    currentLocation: profile.currentLocation.trim(),
    address: profile.address.trim(),
    skills: parseSkills(profile.skills),
    workExperience: [...profile.workExperience]
      .sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')))
      .map((item) => ({
        employer: item.employer.trim(),
        jobDescription: item.jobDescription.trim(),
        startDate: item.startDate,
        currentlyWorking: Boolean(item.currentlyWorking),
        ...(item.currentlyWorking ? {} : { endDate: item.endDate || undefined }),
      })),
    education: profile.education.map((item) => ({
      schoolName: item.schoolName.trim(),
      level: item.level,
      ...(isTertiaryEducation(item.level)
        ? { programOfStudy: item.programOfStudy?.trim() || null }
        : {}),
      startDate: item.startDate,
      endDate: item.endDate || undefined,
    })),
    referees: profile.referees.map((item) => ({
      name: item.name.trim(),
      position: item.position.trim(),
      company: item.company.trim(),
      contactDetails: item.contactDetails.trim(),
    })),
  };
}

export type ApplicantFieldErrors = Record<string, string>;

export function validateApplicantProfileFields(profile: ApplicantProfileFields): ApplicantFieldErrors {
  const errors: ApplicantFieldErrors = {};
  const summary = profile.personalSummary.trim();
  if (!summary) errors.personalSummary = 'Personal summary is required.';
  else if (summary.length < 20) errors.personalSummary = 'Enter at least 20 characters.';

  if (!profile.currentLocation.trim()) errors.currentLocation = 'Current location is required.';
  if (!profile.address.trim()) errors.address = 'Address is required.';
  else if (profile.address.trim().length < 5) errors.address = 'Enter a complete address.';

  if (!profile.skills.length) errors.skills = 'Add at least one skill.';

  if (!profile.workExperience.length) {
    errors.workExperience = 'Add at least one work experience.';
  }

  profile.workExperience.forEach((item, index) => {
    const prefix = `work.${item.id || index}`;
    if (!item.employer.trim()) errors[`${prefix}.employer`] = 'Previous employer is required.';
    if (!item.jobDescription.trim()) errors[`${prefix}.jobDescription`] = 'Job description is required.';
    else if (item.jobDescription.trim().length < 10) errors[`${prefix}.jobDescription`] = 'Enter at least 10 characters.';
    if (!item.startDate) errors[`${prefix}.startDate`] = 'Start date is required.';
    if (!item.currentlyWorking && !item.endDate) errors[`${prefix}.endDate`] = 'End date is required, or mark currently working here.';
    if (!item.currentlyWorking && item.startDate && item.endDate && item.endDate < item.startDate) {
      errors[`${prefix}.endDate`] = 'End date cannot be earlier than start date.';
    }
  });

  if (!profile.education.length) {
    errors.education = 'Add at least one education record.';
  }

  profile.education.forEach((item, index) => {
    const prefix = `edu.${item.id || index}`;
    if (!item.schoolName.trim()) errors[`${prefix}.schoolName`] = 'School name is required.';
    if (!item.level) errors[`${prefix}.level`] = 'Level is required.';
    if (item.level === 'TERTIARY_EDUCATION' && !String(item.programOfStudy || '').trim()) {
      errors[`${prefix}.programOfStudy`] = 'Program of study is required for tertiary education.';
    }
    if (!item.startDate) errors[`${prefix}.startDate`] = 'Start date is required.';
    if (!item.endDate) errors[`${prefix}.endDate`] = 'End date is required.';
    if (item.startDate && item.endDate && item.endDate < item.startDate) {
      errors[`${prefix}.endDate`] = 'End date cannot be earlier than start date.';
    }
  });

  if (profile.referees.length < 2) {
    errors.referees = 'Add at least two referees.';
  }

  profile.referees.forEach((item, index) => {
    const prefix = `ref.${item.id || index}`;
    if (!item.name.trim()) errors[`${prefix}.name`] = 'Referee name is required.';
    if (!item.position.trim()) errors[`${prefix}.position`] = 'Position is required.';
    if (!item.company.trim()) errors[`${prefix}.company`] = 'Company is required.';
    if (!item.contactDetails.trim()) errors[`${prefix}.contactDetails`] = 'Contact details are required.';
    else if (item.contactDetails.trim().length < 5) {
      errors[`${prefix}.contactDetails`] = 'Enter phone, email, or both.';
    }
  });

  return errors;
}

export function validateApplicantProfile(profile: ApplicantProfileFields): string[] {
  return Object.values(validateApplicantProfileFields(profile));
}

export function getApplicantToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(APPLICANT_TOKEN_KEY);
}

export function getApplicant() {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(APPLICANT_KEY);
  return saved ? (JSON.parse(saved) as ApplicantRecord) : null;
}

export function saveApplicantSession(token: string, applicant: ApplicantRecord | null) {
  localStorage.setItem(APPLICANT_TOKEN_KEY, token);
  localStorage.setItem(APPLICANT_KEY, JSON.stringify(applicant));
}

export function clearApplicantSession() {
  localStorage.removeItem(APPLICANT_TOKEN_KEY);
  localStorage.removeItem(APPLICANT_KEY);
}

export function applicantAuthHeaders(): Record<string, string> {
  const token = getApplicantToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
