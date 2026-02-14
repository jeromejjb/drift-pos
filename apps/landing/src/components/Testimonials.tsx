const testimonials = [
  {
    quote: "Drift has transformed how we handle tables. Our customers love it and our staff spends more time serving, not splitting bills.",
    author: "Maria Bellini",
    role: "Owner, Trattoria Bellini",
    rating: 5
  },
  {
    quote: "The pizza claim feature is genius. No more arguments over who had the last slice. Everyone just taps and pays.",
    author: "John Smith",
    role: "Manager, Pizza Heaven",
    rating: 5
  },
  {
    quote: "As a customer, I never want to go back to traditional restaurant payments. Drift just makes sense.",
    author: "Sarah Johnson",
    role: "Regular Diner",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-4xl font-light text-center mb-4">Loved by restaurants and diners</h2>
        <p className="text-gray-400 text-center mb-12">Join hundreds of happy customers</p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <span key={i} className="text-black">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">"{t.quote}"</p>
              <div>
                <p className="font-medium">{t.author}</p>
                <p className="text-sm text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}