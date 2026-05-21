'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-white/50 animate-pulse">Initializing Editor...</p>
      </div>
    </div>
  )
});

export default function EditorWrapper() {
  return <Editor />;
}
