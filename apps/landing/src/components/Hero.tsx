import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const benefits = [
  'Grow average checks—guests reorder without flagging staff',
  'Turn tables faster on busy tasting-room nights',
  'Go live in 7 minutes on your existing processor—no hardware swap',
];

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white px-4 pb-20 pt-28 dark:bg-gray-950 sm:px-6 sm:pb-24 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto w-full max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
        >
          eat · drink · drift
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-5 text-[1.75rem] font-semibold leading-[1.2] tracking-tight text-gray-900 dark:text-white sm:text-4xl sm:leading-tight md:text-[2.75rem]"
        >
          Let tasting-room guests order and pay from their phones—tables turn faster
          without chasing servers.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg"
        >
          Scan, order, pay, drift between tables—all from the guest&apos;s phone.
          <br className="hidden sm:inline" />
          <span className="sm:ml-0">
            {' '}
            Live in 7 minutes with your existing processor. No new hardware, no POS
            replacement.
          </span>
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 space-y-3"
        >
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm sm:text-base">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-gray-700 dark:text-gray-200">{benefit}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 sm:w-auto"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="border-t border-gray-100 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
        >
          Built for brewery taprooms and tasting rooms—not fine dining, counter-only
          spots, or multi-location chains.
        </motion.p>
      </div>
    </section>
  );
}
