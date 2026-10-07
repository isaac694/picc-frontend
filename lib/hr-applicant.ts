export const APPLICANT_TOKEN_KEY = 'hr_applicant_token';
export const APPLICANT_KEY = 'hr_applicant';

export type ApplicantRecord = {
  id?: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
  phone?: string;
};

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
