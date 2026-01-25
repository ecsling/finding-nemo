'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { startNewMission } from '@/lib/mission-state';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export default function Home() {
  const router = useRouter();

  const handleStartMission = () => {
    startNewMission();
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-[#f7f4ef] text-[#131513]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Space+Grotesk:wght@400;500;600&display=swap');

        :root {
          --paper: #f7f4ef;
          --ink: #131513;
          --teal: #0aa6a6;
          --sun: #e47c4b;
          --slate: #4b4f52;
          --mist: #e9e3da;
          --font-heading: 'Fraunces', 'Times New Roman', serif;
          --font-body: 'Space Grotesk', 'Trebuchet MS', sans-serif;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-20 h-[420px] w-[420px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(10,166,166,0.35), rgba(10,166,166,0))',
          }}
        />
        <div
          className="absolute bottom-[-180px] left-[-120px] h-[520px] w-[520px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(228,124,75,0.35), rgba(228,124,75,0))',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(transparent 96%, rgba(19,21,19,0.04) 97%), linear-gradient(90deg, transparent 96%, rgba(19,21,19,0.04) 97%)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border border-[#131513] bg-white" />
          <div className="text-sm uppercase tracking-[0.3em] text-[#131513]" style={{ fontFamily: 'var(--font-body)' }}>
            OceanCache
          </div>
        </div>
        <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.25em] text-[#4b4f52] md:flex" style={{ fontFamily: 'var(--font-body)' }}>
          <a href="#workflow" className="hover:text-[#131513]">Workflow</a>
          <a href="#capabilities" className="hover:text-[#131513]">Capabilities</a>
          <a href="#impact" className="hover:text-[#131513]">Impact</a>
        </div>
        <Link
          href="/dashboard/search-optimizer"
          className="rounded-full border border-[#131513] px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#131513] transition hover:bg-[#131513] hover:text-white"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Launch Demo
        </Link>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-20 pt-10">
        <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-[#131513] bg-white px-4 py-2 text-[11px] uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <span className="h-2 w-2 rounded-full bg-[#0aa6a6]" />
              Recovery Intelligence Platform
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl"
              style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.05 }}
            >
              Clean planning for high-stakes ocean recovery.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base text-[#4b4f52] md:text-lg" style={{ fontFamily: 'var(--font-body)' }}>
              OceanCache turns incident data into prioritized search plans, drift forecasts, and actionable
              dive routes. Keep the operation simple, visual, and accountable from day one.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleStartMission}
                className="inline-flex items-center gap-2 rounded-full bg-[#131513] px-6 py-3 text-sm uppercase tracking-[0.18em] text-white transition hover:bg-[#0f1110]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Start Mission <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/dashboard/search-optimizer"
                className="inline-flex items-center gap-2 rounded-full border border-[#131513] px-6 py-3 text-sm uppercase tracking-[0.18em] text-[#131513] transition hover:bg-[#131513] hover:text-white"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Search Optimizer <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
              <span>Depth Modeling</span>
              <span>Probability Zones</span>
              <span>Asset Routing</span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-[#131513] bg-white p-6 shadow-[0_30px_60px_rgba(19,21,19,0.12)]"
          >
            <motion.div variants={fadeUp} className="space-y-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                Live Mission Snapshot
              </div>
              <div className="text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
                2,850 m depth
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                <div className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                  Drift window
                  <div className="mt-2 text-lg text-[#131513]">72 hrs</div>
                </div>
                <div className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                  Coverage ETA
                  <div className="mt-2 text-lg text-[#131513]">40 hrs</div>
                </div>
                <div className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                  Route length
                  <div className="mt-2 text-lg text-[#131513]">118 km</div>
                </div>
                <div className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                  Success odds
                  <div className="mt-2 text-lg text-[#131513]">68%</div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e3ddd3] bg-[#f3efe8] p-4 text-xs text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                Highlighted zones update automatically as conditions change. The operator only confirms
                the sweep plan.
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section id="capabilities" className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Operational clarity',
              body: 'Translate raw incident data into a compact plan that crews can execute immediately.',
            },
            {
              title: 'Scenario testing',
              body: 'Preview drift windows, adjust asset depth limits, and see changes in coverage in seconds.',
            },
            {
              title: 'Action-first UI',
              body: 'Every panel answers a field question: where, when, and how to deploy next.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#e3ddd3] bg-white p-6"
            >
              <h3 className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section id="workflow" className="mt-20 rounded-3xl border border-[#131513] bg-white p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                Workflow
              </div>
              <h2 className="mt-2 text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
                From incident to dive in four moves.
              </h2>
            </div>
            <div className="text-sm text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
              Designed for quick handoffs between operations, analytics, and dive teams.
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              'Input incident data',
              'Generate probability zones',
              'Align with assets + drift',
              'Publish the search plan',
            ].map((step, idx) => (
              <div key={step} className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                  Step {idx + 1}
                </div>
                <div className="mt-3 text-base text-[#131513]" style={{ fontFamily: 'var(--font-body)' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="impact" className="mt-20 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#e3ddd3] bg-white p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
              Impact
            </div>
            <h2 className="mt-3 text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Less search, more recovery.
            </h2>
            <p className="mt-4 text-sm text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
              OceanCache cuts wasted coverage by focusing crews on high-probability zones and keeping
              asset constraints front and center.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { label: 'Area reduction', value: '38%' },
                { label: 'Faster missions', value: '28%' },
                { label: 'Cost savings', value: '$1.2M' },
                { label: 'Confidence uplift', value: '19 pts' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#e3ddd3] bg-[#fbfaf8] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#4b4f52]" style={{ fontFamily: 'var(--font-body)' }}>
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#131513] bg-[#131513] p-8 text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: 'var(--font-body)' }}>
              Ready to deploy
            </div>
            <h2 className="mt-3 text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Get your next recovery plan live.
            </h2>
            <p className="mt-4 text-sm text-white/70" style={{ fontFamily: 'var(--font-body)' }}>
              Use the search optimizer to shape the plan, then export for the crew in minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleStartMission}
                className="inline-flex items-center gap-2 rounded-full bg-[#e47c4b] px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#131513]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Start Mission <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/dashboard/search-optimizer"
                className="inline-flex items-center gap-2 rounded-full border border-white/50 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Search Optimizer <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#e3ddd3] px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-xs uppercase tracking-[0.2em] text-[#4b4f52] md:flex-row md:items-center md:justify-between" style={{ fontFamily: 'var(--font-body)' }}>
          <span>OceanCache Recovery Systems</span>
          <span>System status: Ready</span>
        </div>
      </footer>
    </div>
  );
}
