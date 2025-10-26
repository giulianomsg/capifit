export interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  features: string[];
  commissionPercentage: number;
  createdAt: string;
}

export interface SubscriptionContract {
  id: string;
  planId: string;
  trainerId: string;
  studentId: string;
  status: 'active' | 'expired' | 'canceled';
  renewalDate: string;
  createdAt: string;
}
