import Link from 'next/link';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Adaptive Training Plan
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Welcome to the Adaptive Training Plan platform. We help runners
            intelligently adjust their training plans based on recent performance
            and health data from Strava.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md bg-[#FC4C02] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#E34402] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FC4C02]"
            >
              Get Started with Strava
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Coming Soon</h2>
            <ul className="mt-6 space-y-4 text-lg text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-6 w-6 flex-shrink-0 text-[#FC4C02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Connect your Strava account</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-6 w-6 flex-shrink-0 text-[#FC4C02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Upload your training plan</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-6 w-6 flex-shrink-0 text-[#FC4C02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Get AI-powered weekly recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
