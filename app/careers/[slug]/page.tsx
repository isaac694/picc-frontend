import { notFound } from 'next/navigation';
import { getPublicVacancyBySlug, vacancies } from '../vacancies';
import VacancyDetailsClient from './VacancyDetailsClient';

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

  return <VacancyDetailsClient slug={slug} initialVacancy={vacancy} />;
}
