import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardSignOut from './sign-out-button';
import EditorWrapper from '@/components/EditorWrapper';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      <EditorWrapper />
    </div>
  );
}
