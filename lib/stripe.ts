import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublicKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be defined');
}

export const stripe = await loadStripe(stripePublicKey); 