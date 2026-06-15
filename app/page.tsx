'use client';

import Link from 'next/link';
import { DollarSign, Users, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 text-white max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <DollarSign size={28} />
          ShareExpenses
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="hover:opacity-80 transition">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-white text-center py-20 px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Split Expenses with Friends
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
          Track who paid what, calculate fair splits, and settle up with Venmo.
          No more confusion about shared expenses.
        </p>
        <Link href="/signup" className="inline-block btn-primary text-lg px-8 py-3">
          Get Started Free
        </Link>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <DollarSign size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Tracking</h3>
              <p className="text-gray-600">
                Log expenses in seconds with flexible split options
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Group Friends</h3>
              <p className="text-gray-600">
                Organize multiple trips or group expenses
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BarChart3 size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Calculations</h3>
              <p className="text-gray-600">
                Automatic split calculations for even or custom amounts
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Zap size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Venmo Integration</h3>
              <p className="text-gray-600">
                Settle payments directly through Venmo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to split smarter?</h2>
          <p className="mb-8 text-lg">Sign up now and start tracking expenses with your friends.</p>
          <Link href="/signup" className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
