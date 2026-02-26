/**
 * Subscription Types
 */

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due';

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentProvider = 'stripe' | 'paypal' | 'sepa' | 'invoice';

export interface Subscription {
  id: number;
  tenant_id: number;
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;

  // Pricing (in cents)
  price_net_cents: number;
  price_gross_cents: number;
  price_net_eur: number;
  price_gross_eur: number;
  vat_rate_percent: number;

  // Trial
  is_trial: boolean;
  trial_ends_at: string | null;

  // Dates
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  expires_at: string | null;

  // Limits
  max_users: number | null;
  max_projects: number | null;
  max_storage_gb: number | null;

  // Payment provider
  payment_provider: PaymentProvider | null;
  payment_provider_subscription_id: string | null;
  payment_provider_customer_id: string | null;

  // Billing
  billing_email: string | null;
  billing_address: string | null;

  // Settings
  auto_renew: boolean;
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relationships
  tenant?: {
    id: number;
    company_name: string;
    email: string;
  };
}

export interface SubscriptionUsage {
  users_count: number;
  users_limit: number | null;
  users_remaining: number | null;
  projects_count: number;
  projects_limit: number | null;
  projects_remaining: number | null;
}

export interface SubscriptionStatusInfo {
  is_active: boolean;
  on_trial: boolean;
  trial_days_remaining: number;
  period_days_remaining: number;
  has_expired: boolean;
  can_be_cancelled: boolean;
}

export interface CurrentSubscriptionResponse {
  subscription: Subscription;
  usage: SubscriptionUsage;
  status_info: SubscriptionStatusInfo;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  past_due: number;
  monthly_revenue_cents: number;
  yearly_revenue_cents: number;
  by_plan: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
  expiring_soon: number;
}

export interface CreateSubscriptionRequest {
  tenant_id: number;
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
  status?: SubscriptionStatus;
  price_net_cents: number;
  price_gross_cents: number;
  vat_rate_percent: number;
  is_trial?: boolean;
  trial_ends_at?: string;
  started_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  expires_at?: string;
  max_users?: number;
  max_projects?: number;
  max_storage_gb?: number;
  payment_provider?: PaymentProvider;
  payment_provider_subscription_id?: string;
  payment_provider_customer_id?: string;
  billing_email?: string;
  billing_address?: string;
  auto_renew?: boolean;
  notes?: string;
}

export interface UpgradeRequest {
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
  message?: string;
}
