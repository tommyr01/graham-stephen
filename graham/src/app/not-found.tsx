import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered an incorrect URL.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Go Back Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>If you believe this is an error, please contact support.</p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/research" className="block text-blue-600 hover:text-blue-800 transition-colors">
                LinkedIn Research Tool
              </Link>
              <Link href="/training" className="block text-blue-600 hover:text-blue-800 transition-colors">
                AI Training Dashboard
              </Link>
              <Link href="/profile-research" className="block text-blue-600 hover:text-blue-800 transition-colors">
                Profile Research
              </Link>
              <Link href="/analytics" className="block text-blue-600 hover:text-blue-800 transition-colors">
                Analytics Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}