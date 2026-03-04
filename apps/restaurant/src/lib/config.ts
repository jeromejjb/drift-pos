export const config = {
  // API URL - Vite will replace this at build time
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.driftpos.com',

  // Landing page URL - for login/signup redirects (single source of truth)
  landingUrl: import.meta.env.VITE_LANDING_URL || 'https://driftpos.com',

  // App URL - You'll need to add this to your .env and Vite config
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5174',

  // Routes
  routes: {
    login: '/login',
    dashboard: (id: string) => `/dashboard/${id}`,
    onboarding: (id: string) => `/onboarding?restaurantId=${id}`,
  },
};