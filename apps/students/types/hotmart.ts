export interface HotmartWebhookPayload {
  id: string;
  creation_date: number;
  event: HotmartWebhookEvent;
  version: string;
  data?: HotmartWebhookData;
}

export type HotmartWebhookEvent =
  | "PURCHASE_APPROVED"
  | "PURCHASE_CANCELED"
  | "PURCHASE_COMPLETE"
  | "PURCHASE_BILLET_PRINTED"
  | "PURCHASE_PROTEST"
  | "PURCHASE_REFUNDED"
  | "PURCHASE_CHARGEBACK"
  | "PURCHASE_EXPIRED"
  | "PURCHASE_DELAYED";

export interface HotmartWebhookData {
  product?: HotmartProduct;
  buyer?: HotmartBuyer;
  purchase?: HotmartPurchase;
  subscription?: HotmartSubscription;
}

export interface HotmartProduct {
  id?: number;
  ucode?: string;
  name?: string;
  has_co_production?: boolean;
  warranty_date?: string;
  support_email?: string;
  is_physical_product?: boolean;
}

export interface HotmartBuyer {
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  checkout_phone?: string;
  checkout_phone_code?: string;
  document?: string;
  document_type?: string;
  address?: {
    zipcode?: string;
    country?: string;
    number?: string;
    address?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    complement?: string;
    country_iso?: string;
  };
}

export interface HotmartPurchase {
  approved_date?: number;
  recurrence_number?: number;
  subscription_anticipation_purchase?: boolean;
  order_date?: string;
  date_next_charge?: number;
  status?: HotmartPurchaseStatus;
  transaction?: string;
  payment?: {
    type?: HotmartPaymentType;
    installments_number?: number;
    refusal_reason?: string;
  };
  offer?: {
    code?: string;
    coupon_code?: string;
    name?: string;
    description?: string;
  };
  price?: {
    value?: number;
    currency_value?: string;
  };
  full_price?: {
    value?: number;
    currency_value?: string;
  };
}

export type HotmartPurchaseStatus =
  | "APPROVED"
  | "BLOCKED"
  | "CANCELLED"
  | "CHARGEBACK"
  | "COMPLETE"
  | "EXPIRED"
  | "NO_FUNDS"
  | "OVERDUE"
  | "PARTIALLY_REFUNDED"
  | "PRE_ORDER"
  | "PRINTED_BILLET"
  | "PROCESSING_TRANSACTION"
  | "DISPUTE"
  | "REFUNDED"
  | "STARTED"
  | "UNDER_ANALISYS"
  | "WAITING_PAYMENT";

export type HotmartPaymentType =
  | "BILLET"
  | "CASH_PAYMENT"
  | "CREDIT_CARD"
  | "DIRECT_BANK_TRANSFER"
  | "DIRECT_DEBIT"
  | "FINANCED_BILLET"
  | "FINANCED_INSTALLMENT"
  | "GOOGLE_PAY"
  | "HOTCARD"
  | "HYBRID"
  | "MANUAL_TRANSFER"
  | "PAYPAL"
  | "PAYPAL_INTERNACIONAL"
  | "PICPAY"
  | "PIX"
  | "SAMSUNG_PAY"
  | "WALLET";

export interface HotmartSubscription {
  status?: string;
  plan?: {
    id?: number;
    name?: string;
  };
  subscriber?: {
    code?: string;
  };
}

export interface HotmartMentorshipSignupData {
  accessId: string;
  buyerEmail: string;
  buyerName: string | null;
  buyerDocument: string | null;
  buyerDocumentType: string | null;
  phoneCountryCode: string;
  phone: string | null;
  acquisitionChannel: "HOTMART_MENTORIA";
}

export type HotmartMentorshipSignupActionResult =
  | {
      status: "success";
      data: HotmartMentorshipSignupData;
    }
  | {
      status: "invalid_token";
    }
  | {
      status: "already_claimed";
    };
