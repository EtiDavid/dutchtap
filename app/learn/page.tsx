import { Suspense } from 'react';
import { LearningHub } from '@/components/learning/LearningHub';
export default function LearnPage() {
  return <Suspense fallback={<p className="p-6">Loading practice…</p>}><LearningHub /></Suspense>;
}
