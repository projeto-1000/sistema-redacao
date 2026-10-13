import type { SavedPaymentCard } from "./checkout";

export interface ManagedPaymentCard extends SavedPaymentCard {
  isUsedForSubscription: boolean;
}

export interface PaymentMethodsPageData {
  cards: ManagedPaymentCard[];
  hasActiveCardSubscription: boolean;
}
