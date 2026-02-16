import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Mail, MessageCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I start using Drift?',
        a: 'Sign up for a free account — no credit card required. You can set up your business profile, add your menu or products, and generate QR codes immediately. When you\'re ready to accept payments, connect your bank account (takes about 5 minutes).'
      },
      {
        q: 'Do I need any special hardware?',
        a: 'Nope. Drift works entirely through QR codes and smartphones. Your customers scan, order, and pay from their own devices. No terminals, no dongles, no expensive hardware.'
      },
      {
        q: 'How long does onboarding take?',
        a: 'Most businesses go from signup to first payment in under 30 minutes. Setting up your menu or products takes the most time, but you can import from a spreadsheet or use one of our templates.'
      }
    ]
  },
  {
    category: 'Payments & Pricing',
    questions: [
      {
        q: 'What are your fees?',
        a: 'Our base rate is 2.5% per transaction. Businesses processing over $50,000/month qualify for volume discounts down to 1.5%. There are no setup fees, monthly minimums, or hidden charges.'
      },
      {
        q: 'When do I get paid?',
        a: 'Payouts are sent next business day by default. For businesses with consistent volume, we offer instant payouts to a debit card for a small fee (1%).'
      },
      {
        q: 'How do refunds work?',
        a: 'Full refunds can be issued directly from your dashboard. The transaction fee is also refunded, so you\'re not charged for refunded transactions.'
      }
    ]
  },
  {
    category: 'Customers & Experience',
    questions: [
      {
        q: 'Do customers need to download an app?',
        a: 'No app required. Customers scan a QR code with their phone camera and order directly in their browser. It works on any smartphone — no downloads, no accounts.'
      },
      {
        q: 'How does bill splitting work?',
        a: 'For group orders, each person can claim individual items or split shared items (like a pizza) by tapping how many slices they took. Each person pays for exactly what they ordered.'
      },
      {
        q: 'Can customers tip?',
        a: 'Yes. Tipping is built into the checkout flow. You set the suggested percentages, and customers can choose or enter a custom amount.'
      }
    ]
  },
  {
    category: 'Account & Security',
    questions: [
      {
        q: 'Is Drift secure?',
        a: 'We use 256-bit encryption and are PCI DSS Level 1 compliant — the highest level of payment security. Your data is never shared or sold.'
      },
      {
        q: 'Can I use Drift for multiple locations?',
        a: 'Absolutely. You can manage multiple locations from a single dashboard. Enterprise plans include multi-location reporting and consolidated payouts.'
      },
      {
        q: 'What happens if I want to leave?',
        a: 'You own your data. You can export all customer and transaction history anytime. There are no cancellation fees or contracts.'
      }
    ]
  }
];

export function FAQ() {
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestions(prev =>
      prev.includes(question)
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HelpCircle className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Questions?
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  We've got answers.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-3xl mx-auto">
          {faqs.map((section, sectionIdx) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIdx * 0.1 }}
              className="mb-8"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(section.category)}
                className="w-full flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors mb-2"
              >
                <h2 className="text-2xl font-light">{section.category}</h2>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    openCategories.includes(section.category) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Questions */}
              <AnimatePresence>
                {openCategories.includes(section.category) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pl-4"
                  >
                    {section.questions.map((item, qIdx) => (
                      <div key={qIdx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(`${section.category}-${qIdx}`)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900">{item.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              openQuestions.includes(`${section.category}-${qIdx}`) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {openQuestions.includes(`${section.category}-${qIdx}`) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-5 pb-5 text-gray-400"
                            >
                              {item.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still have questions? */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-black text-white rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-4">Still have questions?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-gray-100 transition-colors">
                <Mail className="w-4 h-4" />
                Email us
              </button>
              <button className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Live chat
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}