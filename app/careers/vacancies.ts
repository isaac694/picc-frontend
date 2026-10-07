import { apiUrl } from '@/lib/api';

export type Vacancy = {
  id?: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  posted: string;
  closingDate: string;
  summary: string;
  requirements: string[];
  responsibilities: string[];
  documents: string[];
};

type ApiVacancy = Partial<{
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  type: string;
  postedAt: string;
  createdAt: string;
  closesAt: string;
  closingDate: string;
  summary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  requiredDocuments: Array<string | { label?: string; name?: string; description?: string }>;
  documents: string[];
}>;

function formatDate(value?: string) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function normalizeVacancy(vacancy: ApiVacancy): Vacancy {
  const requiredDocuments = vacancy.requiredDocuments || vacancy.documents || [];

  return {
    id: vacancy.id,
    slug: vacancy.slug || vacancy.id || '',
    title: vacancy.title || 'Untitled Vacancy',
    department: vacancy.department || 'PICC',
    location: vacancy.location || 'Lilongwe',
    type: vacancy.employmentType || vacancy.type || 'Full Time',
    posted: formatDate(vacancy.postedAt || vacancy.createdAt),
    closingDate: formatDate(vacancy.closesAt || vacancy.closingDate),
    summary: vacancy.summary || vacancy.description || 'Vacancy details will be shared soon.',
    requirements: vacancy.requirements || [],
    responsibilities: vacancy.responsibilities || [],
    documents: requiredDocuments.map((document) => {
      if (typeof document === 'string') return document;
      return document.label || document.name || document.description || 'Required document';
    }),
  };
}

export const vacancies: Vacancy[] = [
  {
    slug: 'secondary-school-teacher',
    title: 'Secondary School Teacher',
    department: 'PICC Secondary School',
    location: 'Area 49, Lilongwe',
    type: 'Full Time',
    posted: 'Oct 6, 2026',
    closingDate: 'Nov 15, 2026',
    summary:
      'PICC Secondary School is looking for a passionate teacher to support academic excellence, discipline, and Christ-centered student formation.',
    requirements: [
      'Bachelor of Education or relevant teaching qualification.',
      'Experience teaching secondary school learners.',
      'Strong classroom management and communication skills.',
      'Commitment to Christian values and student mentorship.',
    ],
    responsibilities: [
      'Prepare engaging lessons that meet secondary school curriculum standards.',
      'Assess learners regularly and provide timely academic feedback.',
      'Maintain discipline and a positive classroom learning environment.',
      'Support student mentorship, chapel activities, and school programs.',
    ],
    documents: [
      'Updated CV',
      'Cover letter',
      'Copies of academic and professional certificates',
      'Two professional references',
    ],
  },
  {
    slug: 'mathematics-teacher',
    title: 'Mathematics Teacher',
    department: 'PICC Secondary School',
    location: 'Area 49, Lilongwe',
    type: 'Full Time',
    posted: 'Oct 6, 2026',
    closingDate: 'Nov 20, 2026',
    summary:
      'PICC Secondary School is seeking a Mathematics Teacher who can help learners build strong analytical, problem-solving, and exam preparation skills.',
    requirements: [
      'Bachelor of Education with Mathematics or related qualification.',
      'Experience teaching mathematics at secondary school level.',
      'Ability to prepare lesson plans, assessments, and learner progress reports.',
      'Passion for mentoring students in a Christian learning environment.',
    ],
    responsibilities: [
      'Teach mathematics lessons that build learner confidence and mastery.',
      'Prepare exercises, tests, assignments, and examination revision plans.',
      'Track learner performance and support students who need extra help.',
      'Work with other teachers to improve academic outcomes.',
    ],
    documents: [
      'Updated CV',
      'Cover letter',
      'Copies of teaching certificates',
      'Evidence of mathematics teaching experience',
    ],
  },
  {
    slug: 'english-teacher',
    title: 'English Teacher',
    department: 'PICC Secondary School',
    location: 'Area 49, Lilongwe',
    type: 'Full Time',
    posted: 'Oct 6, 2026',
    closingDate: 'Nov 20, 2026',
    summary:
      'PICC Secondary School is looking for an English Teacher to strengthen learners in reading, writing, grammar, literature, and confident communication.',
    requirements: [
      'Bachelor of Education with English or related qualification.',
      'Experience teaching English language or literature to secondary learners.',
      'Strong written and verbal communication skills.',
      'Commitment to academic excellence, discipline, and student growth.',
    ],
    responsibilities: [
      'Teach English language, grammar, writing, and literature lessons.',
      'Help learners improve reading comprehension and public speaking.',
      'Prepare class assignments, tests, and examination revision materials.',
      'Promote a culture of reading and clear communication.',
    ],
    documents: [
      'Updated CV',
      'Cover letter',
      'Copies of English or teaching certificates',
      'Two professional references',
    ],
  },
];

export function getVacancyBySlug(slug: string) {
  return vacancies.find((vacancy) => vacancy.slug === slug);
}

export async function getPublicVacancies(): Promise<Vacancy[]> {
  try {
    const response = await fetch(apiUrl('/api/hr/vacancies'), {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return vacancies;
    const list: ApiVacancy[] = Array.isArray(data) ? data : data.vacancies || [];
    return list.length ? list.map(normalizeVacancy) : vacancies;
  } catch {
    return vacancies;
  }
}

export async function getPublicVacancyBySlug(slug: string): Promise<Vacancy | undefined> {
  try {
    const response = await fetch(apiUrl(`/api/hr/vacancies/${slug}`), {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return normalizeVacancy(data.vacancy || data);
    }
  } catch {
    // Fall through to the local dummy vacancies when the backend is unavailable.
  }

  return getVacancyBySlug(slug);
}
