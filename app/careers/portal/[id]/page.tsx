import ApplicationDetailClient from './ApplicationDetailClient';

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vacancyId?: string }>;
};

export default async function ApplicationDetailPage({ params, searchParams }: ApplicationDetailPageProps) {
  const { id } = await params;
  const { vacancyId } = await searchParams;
  return <ApplicationDetailClient id={id} vacancyId={vacancyId} />;
}
