import axios, { AxiosError } from 'axios';
import { supabase } from '../supabase';

// Asegurarnos de que siempre tengamos una URL válida
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper para construir la URL correctamente, evitando doble /api
function constructApiUrl(baseUrl: string, endpointPath: string): string {
  // Quita una posible barra diagonal al final de baseUrl
  const trimmedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Quita una posible barra diagonal al inicio de endpointPath
  const trimmedEndpointPath = endpointPath.startsWith('/') ? endpointPath.slice(1) : endpointPath;
  
  // Si baseUrl ya termina con /api y endpointPath empieza con api/, ajusta
  if (trimmedBaseUrl.endsWith('/api') && trimmedEndpointPath.startsWith('api/')) {
    // Usa solo la parte después de 'api/' en endpointPath
    const pathWithoutApi = trimmedEndpointPath.substring('api/'.length);
    return `${trimmedBaseUrl}/${pathWithoutApi}`;
  }
  
  // Si baseUrl NO termina con /api, y endpointPath NO empieza con api/, añade /api/
  if (!trimmedBaseUrl.endsWith('/api') && !trimmedEndpointPath.startsWith('api/')) {
    return `${trimmedBaseUrl}/api/${trimmedEndpointPath}`;
  } 
  
  // En otros casos (uno tiene /api y el otro no), simplemente une
  return `${trimmedBaseUrl}/${trimmedEndpointPath}`;
}

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
    const url = constructApiUrl(API_URL, '/payments/create-subscription');
    const response = await fetch(url, {
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
    const url = constructApiUrl(API_URL, '/payments/create-checkout-session');
    const response = await fetch(url, {
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
    const url = constructApiUrl(API_URL, '/payments/subscription-status');
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