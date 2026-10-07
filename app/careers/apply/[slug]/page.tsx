import { notFound } from 'next/navigation';
import ApplyPageClient from './ApplyPageClient';
import { getPublicVacancyBySlug, vacancies } from '../../vacancies';

type ApplyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return vacancies.map((vacancy) => ({ slug: vacancy.slug }));
}

export async function generateMetadata({ params }: ApplyPageProps) {
  const { slug } = await params;
  const vacancy = await getPublicVacancyBySlug(slug);
  return {
    title: vacancy ? `Apply - ${vacancy.title}` : 'Apply - PICC Careers',
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params;
  const vacancy = await getPublicVacancyBySlug(slug);
  if (!vacancy) notFound();
  return <ApplyPageClient vacancy={vacancy} />;
}
