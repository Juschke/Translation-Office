import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/api/services';
import type { CurrentSubscriptionResponse, UpgradeRequest } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FaCrown, FaCheckCircle, FaExclamationTriangle, FaClock, FaRocket } from 'react-icons/fa';
import { Spin, Modal, Form, Select, Input, message } from 'antd';
import clsx from 'clsx';

const { TextArea } = Input;

const PLAN_INFO = {
  free: {
    name: 'Free',
    icon: '🆓',
    color: 'slate',
    features: ['Basis-Funktionen', 'Begrenzte Nutzer', 'Email-Support'],
  },
  starter: {
    name: 'Starter',
    icon: '🚀',
    color: 'blue',
    features: ['Bis zu 3 Nutzer', 'Bis zu 50 Projekte', '10 GB Speicher', 'Email-Support'],
  },
  professional: {
    name: 'Professional',
    icon: '💼',
    color: 'purple',
    features: ['Bis zu 10 Nutzer', 'Bis zu 200 Projekte', '50 GB Speicher', 'Priority Support', 'API-Zugriff'],
  },
  enterprise: {
    name: 'Enterprise',
    icon: '🏢',
    color: 'amber',
    features: ['Unbegrenzte Nutzer', 'Unbegrenzte Projekte', '200 GB Speicher', '24/7 Support', 'Dedizierter Account Manager'],
  },
};

const STATUS_CONFIG = {
  active: { label: 'Aktiv', icon: FaCheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  trial: { label: 'Testversion', icon: FaClock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  cancelled: { label: 'Gekündigt', icon: FaExclamationTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  expired: { label: 'Abgelaufen', icon: FaExclamationTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  past_due: { label: 'Zahlungsrückstand', icon: FaExclamationTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
};

const SubscriptionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, error } = useQuery<CurrentSubscriptionResponse>({
    queryKey: ['subscription'],
    queryFn: subscriptionService.getCurrent,
  });

  const upgradeMutation = useMutation({
    mutationFn: (values: UpgradeRequest) => subscriptionService.requestUpgrade(values),
    onSuccess: () => {
      message.success('Ihre Upgrade-Anfrage wurde erfolgreich übermittelt!');
      setUpgradeModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: () => {
      message.error('Fehler beim Senden der Upgrade-Anfrage');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-sm border border-slate-200 shadow-sm bg-white p-8 text-center">
        <FaExclamationTriangle className="text-4xl text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Keine Subscription gefunden</h3>
        <p className="text-slate-500">Es konnte keine aktive Subscription für Ihren Tenant gefunden werden.</p>
      </div>
    );
  }

  const { subscription, usage, status_info } = data;
  const planInfo = PLAN_INFO[subscription.plan];
  const statusConfig = STATUS_CONFIG[subscription.status];

  const formatDate = (date: string | null) => {
    if (!date) return 'Nicht verfügbar';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatEur = (cents: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  const handleUpgrade = () => {
    form.validateFields().then((values) => {
      upgradeMutation.mutate(values);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Mein Abonnement</h2>
          <p className="text-sm text-slate-500">Verwalten Sie Ihr Abonnement und sehen Sie die Nutzungsstatistiken ein.</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-sm border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{planInfo.icon}</div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  {planInfo.name}
                  {subscription.plan !== 'free' && <FaCrown className="text-amber-500" />}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
                    <statusConfig.icon />
                    {statusConfig.label}
                  </span>
                  {subscription.billing_cycle === 'monthly' && (
                    <span className="text-xs text-slate-500 font-medium">Monatlich</span>
                  )}
                  {subscription.billing_cycle === 'yearly' && (
                    <span className="text-xs text-slate-500 font-medium">Jährlich</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-800">{formatEur(subscription.price_gross_cents)}</div>
              <div className="text-sm text-slate-500">
                pro {subscription.billing_cycle === 'monthly' ? 'Monat' : 'Jahr'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                inkl. {subscription.vat_rate_percent}% MwSt.
              </div>
            </div>
          </div>

          {/* Trial Warning */}
          {status_info.on_trial && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-sm">
              <div className="flex items-start gap-3">
                <FaClock className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Testversion läuft ab</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Ihre Testversion endet in {status_info.trial_days_remaining} Tagen ({formatDate(subscription.trial_ends_at)})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Enthaltene Features:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {planInfo.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-green-500 text-xs shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade Button */}
          {subscription.plan !== 'enterprise' && (
            <Button onClick={() => setUpgradeModalOpen(true)} className="w-full sm:w-auto">
              <FaRocket className="mr-2" />
              Plan upgraden
            </Button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="rounded-sm border border-slate-200 shadow-sm bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Nutzungsstatistiken</h3>

        <div className="space-y-6">
          {/* Users */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Benutzer</span>
              <span className="text-sm text-slate-600">
                {usage.users_count} / {usage.users_limit ?? '∞'}
              </span>
            </div>
            <Progress
              value={usage.users_limit ? (usage.users_count / usage.users_limit) * 100 : 0}
              className="h-2"
            />
            {usage.users_limit && usage.users_remaining !== null && usage.users_remaining <= 2 && (
              <p className="text-xs text-orange-600 mt-1">⚠️ Nur noch {usage.users_remaining} Plätze verfügbar</p>
            )}
          </div>

          {/* Projects */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Projekte</span>
              <span className="text-sm text-slate-600">
                {usage.projects_count} / {usage.projects_limit ?? '∞'}
              </span>
            </div>
            <Progress
              value={usage.projects_limit ? (usage.projects_count / usage.projects_limit) * 100 : 0}
              className="h-2"
            />
            {usage.projects_limit && usage.projects_remaining !== null && usage.projects_remaining <= 10 && (
              <p className="text-xs text-orange-600 mt-1">⚠️ Nur noch {usage.projects_remaining} Projekte verfügbar</p>
            )}
          </div>

          {/* Storage (wenn definiert) */}
          {subscription.max_storage_gb && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Speicherplatz</span>
                <span className="text-sm text-slate-600">{subscription.max_storage_gb} GB verfügbar</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Period */}
      <div className="rounded-sm border border-slate-200 shadow-sm bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Abrechnungsinformationen</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Gestartet am:</span>
            <p className="font-medium text-slate-800">{formatDate(subscription.started_at)}</p>
          </div>
          <div>
            <span className="text-slate-500">Aktueller Zeitraum:</span>
            <p className="font-medium text-slate-800">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Läuft ab am:</span>
            <p className="font-medium text-slate-800">{formatDate(subscription.expires_at)}</p>
          </div>
          <div>
            <span className="text-slate-500">Automatische Verlängerung:</span>
            <p className="font-medium text-slate-800">{subscription.auto_renew ? 'Ja' : 'Nein'}</p>
          </div>
          {subscription.billing_email && (
            <div>
              <span className="text-slate-500">Rechnungs-Email:</span>
              <p className="font-medium text-slate-800">{subscription.billing_email}</p>
            </div>
          )}
          {subscription.payment_provider && (
            <div>
              <span className="text-slate-500">Zahlungsmethode:</span>
              <p className="font-medium text-slate-800 capitalize">{subscription.payment_provider}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal
        title="Plan upgraden"
        open={upgradeModalOpen}
        onCancel={() => setUpgradeModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setUpgradeModalOpen(false)}>
            Abbrechen
          </Button>,
          <Button key="submit" onClick={handleUpgrade} isLoading={upgradeMutation.isPending}>
            Anfrage senden
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Neuer Plan"
            name="plan"
            rules={[{ required: true, message: 'Bitte wählen Sie einen Plan' }]}
          >
            <Select placeholder="Plan auswählen">
              {subscription.plan !== 'starter' && <Select.Option value="starter">Starter</Select.Option>}
              {subscription.plan !== 'professional' && <Select.Option value="professional">Professional</Select.Option>}
              {subscription.plan !== 'enterprise' && <Select.Option value="enterprise">Enterprise</Select.Option>}
            </Select>
          </Form.Item>

          <Form.Item
            label="Abrechnungszyklus"
            name="billing_cycle"
            rules={[{ required: true, message: 'Bitte wählen Sie einen Zyklus' }]}
          >
            <Select placeholder="Zyklus auswählen">
              <Select.Option value="monthly">Monatlich</Select.Option>
              <Select.Option value="yearly">Jährlich (2 Monate gratis)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Nachricht (optional)" name="message">
            <TextArea rows={3} placeholder="Zusätzliche Informationen oder Wünsche..." />
          </Form.Item>
        </Form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          ℹ️ Ihre Upgrade-Anfrage wird an unser Team gesendet. Wir werden uns in Kürze bei Ihnen melden.
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionTab;
