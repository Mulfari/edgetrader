import axios, { AxiosError } from 'axios';
import { supabase } from '../supabase';

// Asegurarnos de que siempre tengamos una URL válida
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
}

export class PaymentService {
  private static async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }

  static async createSubscription(planId: string, email: string): Promise<CreateSubscriptionResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/create-subscription`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creating subscription');
    }

    return response.json();
  }

  static async createCheckoutSession(planId: string, email: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creating checkout session');
    }

    return response.json();
  }

  static async getSubscriptionStatus(): Promise<{ status: string }> {
    const headers = await this.getAuthHeaders();
    const url = `${API_URL}/payments/subscription-status`;
    console.log('Calling subscription status endpoint:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error fetching subscription status');
    }

    return response.json();
  }
} 