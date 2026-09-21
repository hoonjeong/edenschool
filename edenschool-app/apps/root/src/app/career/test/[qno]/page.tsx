import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { TestRunner } from '@/components/career/TestRunner';
import { findTest } from '@/lib/careernet/content';
import { loadRunnerQuestions } from '@/lib/careernet/tests';

export default async function TestRunPage({ params }: { params: Promise<{ qno: string }> }) {
  const { qno } = await params;
  const test = findTest(qno);
  if (!test) notFound();

  let questions;
  try {
    questions = await loadRunnerQuestions(test);
  } catch (e) {
    return (
      <CareerShell title="진로심리검사 센터">
        <CareerError error={e} />
      </CareerShell>
    );
  }

  return (
    <CareerShell title="진로심리검사 센터">
      <TestRunner qno={test.qno} version={test.version} name={test.name} target={test.target} minutes={test.minutes} questions={questions} />
    </CareerShell>
  );
}
