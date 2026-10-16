'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Briefcase, CalendarDays, Clock, GraduationCap, Loader2, MapPin } from 'lucide-react';
import CareerApplyButton from '@/components/careers/CareerApplyButton';
import { loadPublicVacanciesFromApi, type Vacancy } from '@/app/careers/vacancies';

export default function CareersOpenPositions() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await loadPublicVacanciesFromApi();
        if (!cancelled) setVacancies(list);
      } catch {
        if (!cancelled) {
          setVacancies([]);
          setLoadError('Could not load vacancies. Please refresh the page.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = vacancies[0];

  return (
    <>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-secondary text-sm font-semibold uppercase tracking-[0.25em]">Careers</p>
          <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
            Open Positions ({isLoading ? '…' : vacancies.length})
          </h2>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <p className="max-w-2xl text-muted-foreground">
            Review current openings and apply through the Applicant Portal.
          </p>
          <Link href="/careers/portal" className="text-sm font-semibold text-primary hover:underline">
            My applications
          </Link>
        </div>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Job Title</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Posted</th>
                <th className="px-6 py-4 font-semibold">Closing Date</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading open positions…
                    </span>
                  </td>
                </tr>
              ) : vacancies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    There are no open positions at the moment. Check back later or contact PICC if you have questions
                    about future opportunities.
                  </td>
                </tr>
              ) : (
                vacancies.map((item) => (
                  <tr key={item.id || item.slug || item.title} className="hover:bg-slate-50/80">
                    <td className="px-6 py-5 font-semibold text-primary">{item.title}</td>
                    <td className="px-6 py-5">{item.department}</td>
                    <td className="px-6 py-5">{item.location}</td>
                    <td className="px-6 py-5">{item.type}</td>
                    <td className="px-6 py-5">{item.posted}</td>
                    <td className="px-6 py-5">{item.closingDate}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/careers/${item.slug || item.id}`}
                          className="inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary-foreground transition-colors hover:bg-secondary/90"
                        >
                          View Details
                        </Link>
                        <CareerApplyButton
                          vacancyIdOrSlug={item.id || item.slug}
                          title={item.title}
                          portalConfig={item.portalConfig}
                          className="inline-flex rounded-full border border-secondary px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-secondary/10"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && featured ? (
        <div className="mt-10">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-sm font-semibold text-primary">
              <GraduationCap className="h-4 w-4 text-secondary" />
              Featured Vacancy
            </div>
            <h3 className="text-2xl font-bold text-primary md:text-3xl">{featured.title}</h3>
            <p className="mt-4 leading-relaxed text-muted-foreground">{featured.summary}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Briefcase className="mt-0.5 h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Department</p>
                  <p className="text-sm text-slate-600">{featured.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Location</p>
                  <p className="text-sm text-slate-600">{featured.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Clock className="mt-0.5 h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Employment Type</p>
                  <p className="text-sm text-slate-600">{featured.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Closing Date</p>
                  <p className="text-sm text-slate-600">{featured.closingDate}</p>
                </div>
              </div>
            </div>

            {featured.requirements.length > 0 ? (
              <div className="mt-8">
                <h4 className="text-lg font-bold text-primary">Minimum Requirements</h4>
                <ul className="mt-4 space-y-3 text-slate-600">
                  {featured.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link
              href={`/careers/${featured.slug || featured.id}`}
              className="mt-8 inline-flex rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              View Full Details
            </Link>
            <CareerApplyButton
              vacancyIdOrSlug={featured.id || featured.slug}
              title={featured.title}
              portalConfig={featured.portalConfig}
              className="ml-3 mt-8 inline-flex rounded-xl border border-secondary px-5 py-3 font-semibold text-primary transition-colors hover:bg-secondary/10"
            />
          </article>
        </div>
      ) : null}
    </>
  );
}
