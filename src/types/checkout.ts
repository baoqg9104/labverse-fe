export interface CheckoutResponse {
  bin: string;
  accountNumber: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  expiredAt: number | null;
  checkoutUrl: string;
  qrCode: string;
}

export interface GetOrderResponse {
  orderCode: number;
  amount: number;
  status: string;
  transactions: Array<{
    transactionDateTime: string;
  }>;
}
