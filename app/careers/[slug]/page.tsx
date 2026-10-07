import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Briefcase, CalendarDays, Clock, FileText, MapPin } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CareerApplyButton from '@/components/careers/CareerApplyButton';
import { getPublicVacancyBySlug, vacancies } from '../vacancies';

type VacancyDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return vacancies.map((vacancy) => ({
    slug: vacancy.slug,
  }));
}

export async function generateMetadata({ params }: VacancyDetailsPageProps) {
  const { slug } = await params;
  const vacancy = await getPublicVacancyBySlug(slug);

  if (!vacancy) {
    return {
      title: 'Vacancy Not Found - PICC',
    };
  }

  return {
    title: `${vacancy.title} - PICC Careers`,
    description: vacancy.summary,
  };
}

export default async function VacancyDetailsPage({ params }: VacancyDetailsPageProps) {
  const { slug } = await params;
  const vacancy = await getPublicVacancyBySlug(slug);

  if (!vacancy) {
    notFound();
  }

  const details = [
    {
      label: 'Department',
      value: vacancy.department,
      icon: Briefcase,
    },
    {
      label: 'Location',
      value: vacancy.location,
      icon: MapPin,
    },
    {
      label: 'Employment Type',
      value: vacancy.type,
      icon: Clock,
    },
    {
      label: 'Closing Date',
      value: vacancy.closingDate,
      icon: CalendarDays,
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />

      <section className="relative overflow-hidden bg-[#0d1f3c] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Careers
          </Link>
          <p className="mt-10 text-secondary font-semibold uppercase tracking-[0.3em]">
            Vacancy Details
          </p>
          <h1 className="mt-4 text-4xl md:text-6xl font-bold">{vacancy.title}</h1>
          <p className="mt-6 max-w-3xl text-lg text-white/80">{vacancy.summary}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                {details.map((detail) => {
                  const Icon = detail.icon;

                  return (
                    <div key={detail.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                      <Icon className="mt-0.5 h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm font-semibold text-primary">{detail.label}</p>
                        <p className="text-sm text-slate-600">{detail.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-primary">Minimum Requirements</h2>
                <ul className="mt-5 space-y-3 text-slate-600">
                  {vacancy.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-primary">Key Responsibilities</h2>
                <ul className="mt-5 space-y-3 text-slate-600">
                  {vacancy.responsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <aside className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4 text-secondary" />
                Application Pack
              </div>
              <h2 className="mt-6 text-2xl font-bold text-primary">How to Apply</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Prepare the documents below and send your application before the closing date.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                {vacancy.documents.map((document) => (
                  <li key={document} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    <span>{document}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-3">
                <CareerApplyButton
                  vacancyIdOrSlug={vacancy.id || vacancy.slug}
                  title={vacancy.title}
                  className="flex w-full items-center justify-center rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
                />
                <a
                  href="mailto:info@piccworldwide.org"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-primary transition-colors hover:bg-slate-50"
                >
                  Email Application
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
