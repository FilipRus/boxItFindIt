import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BoxIT</h1>
          <div className="flex gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-4 py-2 font-medium transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white dark:bg-indigo-500 px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          <div className="mb-8 px-4">
            <svg
              className="w-16 h-16 sm:w-24 sm:h-24 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 sm:mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Never Lose Track of Your Stuff Again
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8">
              Track your moving boxes with QR codes. Simply scan to see what&apos;s inside.
              Perfect for moving, storage, or organizing your home.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-indigo-600 text-white dark:bg-indigo-500 px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition text-base sm:text-lg font-semibold"
            >
              Get Started Free
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-20 max-w-5xl px-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-lg hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Create Boxes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Create a digital inventory for each physical box. Add items with photos,
                descriptions, and categories.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-lg hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Generate QR Codes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Get a unique QR code for each box. Print it and attach it to your
                physical box.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-lg hover:shadow-md transition">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Scan & Find
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Scan the QR code with your phone to instantly see all items in that
                box. No login required.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; 2026 BoxIT. Keep track of your boxes with QR codes.</p>
        </div>
      </footer>
    </div>
  );
}
