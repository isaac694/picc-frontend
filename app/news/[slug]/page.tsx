import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { fetchNewsArticle } from '@/lib/news';
import NewsArticleClient from './NewsArticleClient';

type NewsArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const result = await fetchNewsArticle(slug);
  if (!result) return { title: 'News - PICC' };
  return {
    title: `${result.article.title} - PICC News`,
    description: result.article.excerpt,
    openGraph: result.article.imageUrl ? { images: [result.article.imageUrl] } : undefined,
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f7f5f0]">
        <NewsArticleClient slug={slug} />
      </main>
      <Footer />
    </>
  );
}
