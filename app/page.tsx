'use client';

import Link from 'next/link';
import { DollarSign, Users, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 text-white max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <DollarSign size={28} />
          ShareExpenses
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border-2 border-secondary bg-secondary px-5 py-2 font-semibold text-white shadow-md shadow-indigo-950/20 transition hover:border-emerald-500 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-white/30"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border-2 border-white bg-white px-6 py-2 font-semibold text-primary shadow-md shadow-indigo-950/20 transition hover:bg-indigo-50"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-white text-center py-12 px-6 md:py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Split Expenses with Friends
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
          Track who paid what, calculate fair splits, and record friend payments.
          No more confusion about shared expenses.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-white px-8 py-3 text-lg font-bold text-primary shadow-lg shadow-indigo-950/25 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/40"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features Section */}
      <section className="bg-white px-6 py-10 md:py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <h3 className="text-xl font-semibold mb-2">Payment Tracking</h3>
              <p className="text-gray-600">
                Record cash, Venmo, or Cash App settlements
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
