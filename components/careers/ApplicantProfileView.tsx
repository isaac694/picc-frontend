import { Badge } from '@/components/ui/badge';
import {
  educationLevelLabel,
  formatProgramOfStudy,
  isTertiaryEducation,
  type ApplicantProfileFields,
} from '@/lib/hr-applicant';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export default function ApplicantProfileView({ profile }: { profile: ApplicantProfileFields }) {
  const hasProfile = Boolean(
    profile.personalSummary
    || profile.currentLocation
    || profile.address
    || profile.skills.length
    || profile.workExperience.length
    || profile.education.length
    || profile.referees.length,
  );

  if (!hasProfile) return null;

  return (
    <div className="space-y-6">
      {profile.personalSummary ? (
        <section>
          <h3 className="font-semibold">Describe Yourself</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{profile.personalSummary}</p>
        </section>
      ) : null}

      {profile.currentLocation || profile.address ? (
        <section>
          <h3 className="font-semibold">Location</h3>
          {profile.currentLocation ? (
            <p className="mt-2 text-sm text-foreground/80">
              <span className="font-medium text-foreground">Current location: </span>
              {profile.currentLocation}
            </p>
          ) : null}
          {profile.address ? (
            <p className="mt-1 text-sm text-foreground/80">
              <span className="font-medium text-foreground">Address: </span>
              {profile.address}
            </p>
          ) : null}
        </section>
      ) : null}

      {profile.skills.length ? (
        <section>
          <h3 className="font-semibold">Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        </section>
      ) : null}

      {profile.workExperience.length ? (
        <section>
          <h3 className="font-semibold">Work Experience</h3>
          <div className="mt-3 space-y-3">
            {profile.workExperience.map((item, index) => (
              <div key={item.id || `${item.employer}-${index}`} className="rounded-xl border border-border/60 p-4">
                <p className="font-medium">{item.employer || 'Employer not provided'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.startDate)} — {item.currentlyWorking ? 'Present' : formatDate(item.endDate)}
                </p>
                {item.jobDescription ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{item.jobDescription}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {profile.education.length ? (
        <section>
          <h3 className="font-semibold">Education</h3>
          <div className="mt-3 space-y-3">
            {profile.education.map((item, index) => (
              <div key={item.id || `${item.level}-${index}`} className="rounded-xl border border-border/60 p-4">
                <p className="font-medium">{item.schoolName || 'School not provided'}</p>
                <p className="mt-1 text-sm text-foreground/80">{item.levelLabel || educationLevelLabel(item.level) || 'Level not provided'}</p>
                {isTertiaryEducation(item.level) ? (
                  <p className="mt-1 text-sm text-foreground/80">
                    <span className="font-medium text-foreground">Program of study: </span>
                    {formatProgramOfStudy(item.programOfStudy)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.startDate)} — {formatDate(item.endDate)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {profile.referees.length ? (
        <section>
          <h3 className="font-semibold">Referees</h3>
          <div className="mt-3 space-y-3">
            {profile.referees.map((item, index) => (
              <div key={item.id || `${item.name}-${index}`} className="rounded-xl border border-border/60 p-4">
                <p className="font-medium">{item.name || 'Name not provided'}</p>
                <p className="mt-1 text-sm text-foreground/80">
                  {[item.position, item.company].filter(Boolean).join(' · ') || 'Role not provided'}
                </p>
                {item.contactDetails ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.contactDetails}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
