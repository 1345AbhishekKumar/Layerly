import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/ui/themes';
import QueryProvider from '@/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Layerly - Text Behind Image AI',
  description: 'Create cinematic layered posters by placing text behind subjects in your photos.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} dark`}>
      <body className="font-sans bg-neutral-950 text-neutral-50 antialiased min-h-screen" suppressHydrationWarning>
        <ClerkProvider
        >
          <QueryProvider>
            {children}
            <Toaster theme="dark" position="bottom-right" />
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
