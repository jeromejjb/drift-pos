import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does Drift work?',
    answer: 'Customers scan a QR code on their table, browse the menu, order, and pay from their phone. For shared items like pizza, everyone taps how many slices they took and pays automatically.'
  },
  {
    question: 'Do customers need to download an app?',
    answer: 'No! Drift works entirely in the browser. Customers just scan the QR code with their phone camera and they\'re ready to order.'
  },
  {
    question: 'How do restaurants get paid?',
    answer: 'Payments are processed securely through Stripe. Funds are deposited directly into your bank account on a daily or weekly basis.'
  },
  {
    question: 'What about splitting bills?',
    answer: 'Drift handles splitting automatically. For individual orders, each person pays separately. For shared items, everyone taps their portion and pays their share.'
  },
  {
    question: 'Can I customize my menu?',
    answer: 'Yes! You can add categories, items, descriptions, prices, and modifiers through our easy-to-use dashboard.'
  },
  {
    question: 'Is there a contract or setup fee?',
    answer: 'No contracts, no setup fees. You can cancel anytime. The first month is free so you can try it risk-free.'
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4">
      <div className="container max-w-3xl mx-auto">
        <h2 className="text-4xl font-light text-center mb-4">Frequently asked questions</h2>
        <p className="text-gray-400 text-center mb-12">Everything you need to know about Drift</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-xl">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 text-gray-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}