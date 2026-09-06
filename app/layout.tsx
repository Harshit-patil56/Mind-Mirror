import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
    { media: '(prefers-color-scheme: dark)', color: '#121214' },
  ],
};

export const metadata: Metadata = {
  title: 'MindMirror — Personal Gemini Journal',
  description: 'A private reflective journaling and brainstorming web application with server-side Gemini intelligence and isolated Cloud Firestore storage.',
  openGraph: {
    title: 'MindMirror — Personal Gemini Journal',
    description: 'A private reflective journaling and brainstorming web application with server-side Gemini intelligence and isolated Cloud Firestore storage.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindMirror — Personal Gemini Journal',
    description: 'A private reflective journaling and brainstorming web application with server-side Gemini intelligence and isolated Cloud Firestore storage.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('pjournal_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#F2F2F7] text-[#1D1D1F] dark:bg-[#121214] dark:text-[#FFFFFF] min-h-screen transition-colors duration-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
