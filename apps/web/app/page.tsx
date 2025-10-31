import Link from 'next/link';
import { Zap, BarChart3 } from 'lucide-react';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">AdaptiveRunning</span>
          </div>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          Train Smarter,{' '}
          <span className="bg-blue-600 text-white px-4 py-1 inline-block">
            Not Harder
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Your training plan that adapts in real-time. Connect your Strava data
          and get personalized weekly recommendations based on your actual
          performance.
        </p>
        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-6 py-3 text-base font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Zap className="h-5 w-5" />
            Sign Up with Strava
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-md transition-shadow">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strava Integration</h3>
            <p className="text-sm text-gray-600">
              Automatically sync your running data, heart rate, and performance metrics from Strava.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-md transition-shadow">
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data-Driven Insights</h3>
            <p className="text-sm text-gray-600">
              Analyze your past month's performance to provide intelligent training adjustments.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-md transition-shadow">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Adaptive Plans</h3>
            <p className="text-sm text-gray-600">
              Get personalized weekly tweaks to your training plan that prevent burnout and injury.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect Your Strava</h3>
                <p className="text-gray-600">
                  Link your Strava account to import your running history, including distance, heart rate, and frequency data.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Your Training Plan</h3>
                <p className="text-gray-600">
                  Share your current training plan so we understand your goals and weekly structure.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Get Personalized Recommendations</h3>
                <p className="text-gray-600">
                  Receive data-driven weekly adjustments tailored to your performance and recovery metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Optimize Your Training?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join runners who train smarter with adaptive, data-driven plans.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-6 py-3 text-base font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Zap className="h-5 w-5" />
            Get Started with Strava
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm text-gray-600">
            © 2025 AdaptiveRunning. Train intelligently, run sustainably.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
