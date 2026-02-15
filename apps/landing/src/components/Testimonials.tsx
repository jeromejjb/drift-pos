const testimonials = [
  {
    quote: "We've been using Drift for 3 months and the difference is clear. Table turnover is faster, tips are higher, and customers keep coming back.",
    author: "Maria Bellini",
    role: "Owner, Trattoria Bellini",
    rating: 5
  },
  {
    quote: "The split payment feature alone saves our staff hours each week. No more manual calculations or awkward moments between friends.",
    author: "James Chen",
    role: "Operations Manager, Noodle House",
    rating: 5
  },
  {
    quote: "As a regular at several Drift-enabled restaurants, I can't imagine going back to traditional payments. It just makes sense.",
    author: "Sarah Johnson",
    role: "Early Adopter",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-primary mb-4">Trusted by early adopters</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We're building Drift with feedback from real restaurants and diners
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-primary">{t.author}</p>
                <p className="text-sm text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: Add a subtle callout for more testimonials */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-400">
            Join restaurants like yours • <button className="text-accent hover:underline">Share your experience</button>
          </p>
        </div>
      </div>
    </section>
  );
}