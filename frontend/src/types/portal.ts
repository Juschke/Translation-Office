export interface PortalCustomer {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
}

export interface PortalFile {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface PortalMessage {
  id: number;
  body: string;
  sender: 'customer' | 'team';
  sender_name: string;
  created_at: string;
}

export interface PortalProject {
  id: number;
  title: string;
  status: string;
  source_language?: string;
  target_language?: string;
  deadline?: string;
  created_at: string;
  price?: number; // in cents
  notes?: string;
  files?: PortalFile[];
  messages?: PortalMessage[];
}

export interface PortalInvoice {
  id: number;
  invoice_number: string;
  date: string;
  due_date?: string;
  amount_gross: number; // in cents
  status: string;
  project?: { id: number; title: string };
}

export interface PortalDashboardData {
  customer: PortalCustomer;
  stats: {
    open_projects: number;
    completed_projects: number;
    unpaid_invoices: number;
    open_messages: number;
  };
  recent_projects: PortalProject[];
  recent_invoices: PortalInvoice[];
}
