import axios from 'axios';

const VENMO_API_URL = 'https://api.venmo.com/v1';

interface VenmoPaymentPayload {
  user_id: string;
  phone?: string;
  email?: string;
  amount: number;
  note: string;
  access_token: string;
}

class VenmoClient {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.VENMO_ACCESS_TOKEN || '';
  }

  /**
   * Create a payment request or payment
   * This is a placeholder - actual implementation depends on Venmo API
   */
  async createPayment(payload: VenmoPaymentPayload) {
    try {
      // Note: Venmo API endpoints and authentication may vary
      // This is a template structure - adjust based on actual Venmo API docs
      const response = await axios.post(
        `${VENMO_API_URL}/payments`,
        {
          user_id: payload.user_id,
          amount: payload.amount,
          note: payload.note,
          access_token: this.accessToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Venmo payment error:', error.response?.data || error.message);
      throw new Error('Failed to create Venmo payment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get(
        `${VENMO_API_URL}/payments/${paymentId}?access_token=${this.accessToken}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Venmo fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch payment status');
    }
  }

  /**
   * Get user info for Venmo integration
   */
  async getUserInfo(userId: string) {
    try {
      const response = await axios.get(
        `${VENMO_API_URL}/users/${userId}?access_token=${this.accessToken}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Venmo user fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Venmo user info');
    }
  }
}

export const venmoClient = new VenmoClient();
