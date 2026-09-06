import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-[#F5F5F7] p-4 text-center">
      <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-sm text-[#8E8E93] mb-6">The requested journal resource could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl text-xs font-medium text-black bg-[#F5F5F7] hover:bg-white transition-colors"
      >
        Return to Journal
      </Link>
    </div>
  );
}
