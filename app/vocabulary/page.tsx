import { VocabularyScreen } from '@/components/vocabulary/VocabularyScreen';

export default async function VocabularyPage({ searchParams }: { searchParams: Promise<{ card?: string | string[] }> }) {
  const { card } = await searchParams;
  return <VocabularyScreen key={typeof card === 'string' ? card : ''} cardId={typeof card === 'string' ? card : ''} />;
}
