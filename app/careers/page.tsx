import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Briefcase, CalendarDays, Clock, GraduationCap, MapPin, Search } from 'lucide-react';
import CareerApplyButton from '@/components/careers/CareerApplyButton';
import { getPublicVacancies, type Vacancy } from './vacancies';

export const metadata = {
  title: 'Careers - PICC',
  description: 'Explore current vacancies and service opportunities at PICC.',
};

export default async function CareersPage() {
  const vacancies: Vacancy[] = await getPublicVacancies();
  const vacancy = vacancies[0];

  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />

      <section className="relative overflow-hidden bg-[#0d1f3c] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="relative text-secondary font-semibold uppercase tracking-[0.3em] mb-4">
            Home / Careers
          </p>
          <h1 className="relative text-4xl md:text-6xl font-bold mb-6">
            Join Our Team
          </h1>
          <p className="relative text-lg md:text-xl text-white/85 max-w-3xl mx-auto">
            Build your career with PICC. We are looking for talented people who want to serve with excellence and help shape lives through faith-based education.
          </p>
        </div>
      </section>

      <section className="-mt-10 relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Search by Keyword</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Secondary school teacher</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Location</span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  All Locations
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Department</span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  All Departments
                </div>
              </label>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-secondary text-sm font-semibold uppercase tracking-[0.25em]">
                Careers
              </p>
              <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
                Open Positions ({vacancies.length})
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
                  {vacancies.map((item) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {vacancy ? <div className="mt-10">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-sm font-semibold text-primary">
                <GraduationCap className="h-4 w-4 text-secondary" />
                Featured Vacancy
              </div>
              <h3 className="text-2xl font-bold text-primary md:text-3xl">{vacancy.title}</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">{vacancy.summary}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Briefcase className="mt-0.5 h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Department</p>
                    <p className="text-sm text-slate-600">{vacancy.department}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Location</p>
                    <p className="text-sm text-slate-600">{vacancy.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Clock className="mt-0.5 h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Employment Type</p>
                    <p className="text-sm text-slate-600">{vacancy.type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Closing Date</p>
                    <p className="text-sm text-slate-600">{vacancy.closingDate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-bold text-primary">Minimum Requirements</h4>
                <ul className="mt-4 space-y-3 text-slate-600">
                  {vacancy.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/careers/${vacancy.slug || vacancy.id}`}
                className="mt-8 inline-flex rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                View Full Details
              </Link>
              <CareerApplyButton
                vacancyIdOrSlug={vacancy.id || vacancy.slug}
                title={vacancy.title}
                portalConfig={vacancy.portalConfig}
                className="ml-3 mt-8 inline-flex rounded-xl border border-secondary px-5 py-3 font-semibold text-primary transition-colors hover:bg-secondary/10"
              />
            </article>
          </div> : null}
        </div>
      </section>

      <Footer />
    </main>
  );
}
