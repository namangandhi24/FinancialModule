import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, Brain, Shield, BarChart3, Target, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold">FinPilot AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Your AI-Powered{' '}
            <span className="text-primary">Personal CFO</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Understand where your money goes, track investments, plan financial goals,
            and receive AI-generated insights based on your actual financial data.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">Everything you need to master your finances</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BarChart3, title: 'Net Worth Tracking', desc: 'Real-time assets, liabilities, and net worth across all accounts and currencies.' },
              { icon: Brain, title: 'AI Personal CFO', desc: 'Ask questions about your finances and get data-driven answers, not hallucinations.' },
              { icon: Target, title: 'Goal Planning', desc: 'Set financial goals and track progress with achievement probability estimates.' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'JWT auth, audit logging, encrypted secrets, and role-based access control.' },
              { icon: Zap, title: 'Smart Categorization', desc: 'Automatic transaction categorization with rule engine and AI-powered learning.' },
              { icon: TrendingUp, title: 'Wealth Forecasting', desc: 'Project net worth, cash flow, and goal achievement over 1-20 year horizons.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-card p-6">
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to take control of your finances?</h2>
          <p className="mt-4 text-muted-foreground">Join thousands of users who trust FinPilot AI.</p>
          <Link href="/signup" className="mt-8 inline-block">
            <Button size="lg">Get Started for Free</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinPilot AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
