import apiClient from './clients/api-client';
import { AxiosResponse } from 'axios';
import { ShoppingCart } from '../models/payment';
import { User } from '../models/user';
import {
  SdkTestResponse,
  PaymentLinkResponse
} from '../models/pagseguro';
export default class PagseguroAPI {
  static async testToken (token: string): Promise<SdkTestResponse> {
    const res: AxiosResponse<SdkTestResponse> = await apiClient.post('/api/pagseguro/test_token', { token });
    return res?.data;
  }

  static async createPaymentLink (cart: ShoppingCart, customer: User): Promise<PaymentLinkResponse> {
    const res: AxiosResponse<PaymentLinkResponse> = await apiClient.post('/api/pagseguro/create_payment_link', { cart_items: cart, customer_id: customer.id });
    return res?.data;
  }
}
