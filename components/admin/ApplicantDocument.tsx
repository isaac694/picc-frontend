'use client';

import { forwardRef } from 'react';
import {
  educationLevelLabel,
  formatProgramOfStudy,
  isTertiaryEducation,
  type ApplicantProfileFields,
} from '@/lib/hr-applicant';

export type ApplicantDocumentProps = {
  applicantName: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  vacancyTitle?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  statusLabel: string;
  submittedLabel: string;
  generatedLabel: string;
  interviewLabel?: string;
  profile: ApplicantProfileFields;
  additionalAnswers: Array<{ label: string; value: string }>;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const styles = {
  root: {
    width: '794px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontFamily: 'Georgia, "Times New Roman", serif',
    lineHeight: 1.5,
  } as const,
  hero: {
    background: 'linear-gradient(135deg, #0d1f3c 0%, #1e3a5f 55%, #0d1f3c 100%)',
    color: '#ffffff',
    padding: '32px 36px 28px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  heroAccent: {
    position: 'absolute' as const,
    right: '-40px',
    top: '-40px',
    width: '180px',
    height: '180px',
    borderRadius: '999px',
    background: 'rgba(212, 175, 55, 0.18)',
  },
  kicker: {
    fontSize: '11px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: '#d4af37',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
    margin: 0,
  },
  title: {
    margin: '10px 0 0',
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '15px',
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'system-ui, sans-serif',
  },
  body: {
    padding: '28px 36px 36px',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  },
  metaCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    background: '#f8fafc',
  },
  metaLabel: {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: '#64748b',
    fontFamily: 'system-ui, sans-serif',
    margin: 0,
  },
  metaValue: {
    margin: '6px 0 0',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
  },
  metaDetail: {
    margin: '8px 0 0',
    fontSize: 12,
    color: '#475569',
    fontFamily: 'system-ui, sans-serif',
  },
  section: {
    marginTop: '22px',
    breakInside: 'avoid' as const,
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    borderBottom: '2px solid #0d1f3c',
    paddingBottom: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#0d1f3c',
    fontFamily: 'system-ui, sans-serif',
  },
  sectionMark: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#d4af37',
    flexShrink: 0,
  },
  paragraph: {
    margin: 0,
    fontSize: '14px',
    whiteSpace: 'pre-wrap' as const,
    color: '#334155',
  },
  skillRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '8px',
  },
  skill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    lineHeight: 1.2,
    fontFamily: 'system-ui, sans-serif',
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    textAlign: 'center' as const,
  },
  timelineItem: {
    borderLeft: '3px solid #0d1f3c',
    paddingLeft: '14px',
    marginBottom: '14px',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 14px',
    background: '#fafafa',
    marginBottom: '10px',
  },
  footer: {
    marginTop: '28px',
    paddingTop: '14px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
};

const ApplicantDocument = forwardRef<HTMLDivElement, ApplicantDocumentProps>(
  function ApplicantDocument(props, ref) {
    const {
      applicantName,
      email,
      phone,
      emailVerified,
      vacancyTitle,
      department,
      location: vacancyLocation,
      employmentType,
      statusLabel,
      submittedLabel,
      generatedLabel,
      interviewLabel,
      profile,
      additionalAnswers,
    } = props;

    const vacancyLine = [department, vacancyLocation, employmentType].filter(Boolean).join(' · ');

    return (
      <div ref={ref} style={styles.root}>
        <div style={styles.hero}>
          <div style={styles.heroAccent} aria-hidden />
       
          <h1 style={styles.title}>{applicantName || 'Applicant'}</h1>
          <p style={styles.subtitle}>
            {vacancyTitle ? `Application document · ${vacancyTitle}` : 'Application document'}
          </p>
        </div>

        <div style={styles.body}>
          <div style={styles.metaGrid}>
            <div style={styles.metaCard}>
              <p style={styles.metaLabel}>Contact</p>
              <p style={styles.metaValue}>Email: {email || '—'}</p>
              <p style={{ ...styles.metaValue, fontWeight: 500, marginTop: 4 }}>Phone: {phone || '—'}</p>
              <p style={styles.metaValue}>Address: {profile.address || '—'}</p>
              <p style={styles.metaValue}>Current Location: {profile.currentLocation || '—'}</p>

              
            </div>
            
          </div>

          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Professional summary</h2>
            </div>
            <p style={styles.paragraph}>
              {profile.personalSummary || 'No personal summary was provided.'}
            </p>
          </section>

          {/* <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Location</h2>
            </div>
            <p style={{ ...styles.paragraph, marginBottom: 8 }}>
              <strong style={{ fontFamily: 'system-ui, sans-serif' }}>Current location: </strong>
              {profile.currentLocation || 'Not provided'}
            </p>
            <p style={styles.paragraph}>
              <strong style={{ fontFamily: 'system-ui, sans-serif' }}>Address: </strong>
              {profile.address || 'Not provided'}
            </p>
          </section> */}

          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Skills</h2>
            </div>
            {profile.skills.length ? (
              <div style={styles.skillRow}>
                {profile.skills.map((skill) => (
                  <span key={skill} style={styles.skill}>{skill}</span>
                ))}
              </div>
            ) : (
              <p style={styles.paragraph}>No skills were listed.</p>
            )}
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Work experience</h2>
            </div>
            {profile.workExperience.length ? (
              profile.workExperience.map((item, index) => (
                <div key={item.id || `${item.employer}-${index}`} style={styles.timelineItem}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
                    {item.employer || 'Employer not provided'}
                    {item.currentlyWorking ? ' · Current role' : ''}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
                    {formatDate(item.startDate)} — {item.currentlyWorking ? 'Present' : formatDate(item.endDate)}
                  </p>
                  {item.jobDescription ? (
                    <p style={{ ...styles.paragraph, marginTop: 8 }}>{item.jobDescription}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p style={styles.paragraph}>No work experience was provided.</p>
            )}
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Education</h2>
            </div>
            {profile.education.length ? (
              profile.education.map((item, index) => (
                <div key={item.id || `${item.schoolName}-${index}`} style={styles.card}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
                    {item.schoolName || 'School not provided'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>
                    {item.levelLabel || educationLevelLabel(item.level) || 'Level not provided'}
                  </p>
                  {isTertiaryEducation(item.level) ? (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>
                      <strong style={{ fontFamily: 'system-ui, sans-serif' }}>Program of study: </strong>
                      {formatProgramOfStudy(item.programOfStudy)}
                    </p>
                  ) : null}
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
                    {formatDate(item.startDate)} — {formatDate(item.endDate)}
                  </p>
                </div>
              ))
            ) : (
              <p style={styles.paragraph}>No education records were provided.</p>
            )}
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <span style={styles.sectionMark} />
              <h2 style={styles.sectionTitle}>Referees</h2>
            </div>
            {profile.referees.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {profile.referees.map((item, index) => (
                  <div key={item.id || `${item.name}-${index}`} style={styles.card}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
                      {item.name || 'Name not provided'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
                      {[item.position, item.company].filter(Boolean).join(' · ')}
                    </p>
                    {item.contactDetails ? (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#334155' }}>{item.contactDetails}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.paragraph}>No referees were provided.</p>
            )}
          </section>

          {additionalAnswers.length ? (
            <section style={styles.section}>
              <div style={styles.sectionHead}>
                <span style={styles.sectionMark} />
                <h2 style={styles.sectionTitle}>Additional form responses</h2>
              </div>
              {additionalAnswers.map((item) => (
                <div key={item.label} style={{ ...styles.card, background: '#fff' }}>
                  <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
                    {item.label}
                  </p>
                  <p style={{ ...styles.paragraph, marginTop: 6, fontFamily: 'system-ui, sans-serif' }}>{item.value}</p>
                </div>
              ))}
            </section>
          ) : null}

          <div style={styles.footer}>
            <span>PICC · Confidential HR record</span>
            <span>Generated {generatedLabel}</span>
          </div>
        </div>
      </div>
    );
  },
);

export default ApplicantDocument;
