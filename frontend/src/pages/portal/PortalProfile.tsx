import React from 'react';
import { Card, Form, Input, Divider } from 'antd';
import { Home, Mail, Phone, User } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { portalProfileService } from '../../api/services/portal';
import { usePortal } from '../../context/PortalContext';
import { Button } from '../../components/ui/button';

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  phone?: string;
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_country?: string;
}

const PortalProfile: React.FC = () => {
  const { customer } = usePortal();
  const [form] = Form.useForm<ProfileFormValues>();

  React.useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        address_street: customer.address_street,
        address_zip: customer.address_zip,
        address_city: customer.address_city,
        address_country: customer.address_country,
      });
    }
  }, [customer, form]);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormValues) => portalProfileService.update(data),
    onSuccess: () => {
      toast.success('Profil wurde erfolgreich aktualisiert.');
    },
    onError: () => {
      // errors handled by interceptor
    },
  });

  const handleSubmit = (values: ProfileFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Mein Profil</h1>
        <p className="mt-1 text-sm text-white/70">
          Ihre Kontaktdaten und Profilinformationen verwalten.
        </p>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white max-w-2xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          disabled={mutation.isPending}
          requiredMark={(label, { required }) => (
            <>
              {label}
              {required ? <span className="ml-1 text-slate-600">*</span> : null}
            </>
          )}
        >
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Persönliche Daten
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item
              name="first_name"
              label="Vorname"
              rules={[{ required: true, message: 'Bitte geben Sie Ihren Vornamen ein.' }]}
            >
              <Input prefix={<User className="h-4 w-4 text-slate-400" />} placeholder="Max" />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Nachname"
              rules={[{ required: true, message: 'Bitte geben Sie Ihren Nachnamen ein.' }]}
            >
              <Input prefix={<User className="h-4 w-4 text-slate-400" />} placeholder="Mustermann" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item label="E-Mail-Adresse">
              <Input prefix={<Mail className="h-4 w-4 text-slate-400" />} value={customer?.email ?? ''} disabled className="bg-slate-50" />
            </Form.Item>

            <Form.Item name="phone" label="Telefon">
              <Input prefix={<Phone className="h-4 w-4 text-slate-400" />} placeholder="+49 123 456789" />
            </Form.Item>
          </div>

          <Divider className="my-4" />

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Adresse
          </h3>

          <Form.Item name="address_street" label="Straße und Hausnummer">
            <Input prefix={<Home className="h-4 w-4 text-slate-400" />} placeholder="Musterstraße 12" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Form.Item name="address_zip" label="PLZ">
              <Input placeholder="12345" />
            </Form.Item>

            <Form.Item name="address_city" label="Stadt" className="sm:col-span-2">
              <Input placeholder="Berlin" />
            </Form.Item>
          </div>

          <Form.Item name="address_country" label="Land">
            <Input placeholder="Deutschland" />
          </Form.Item>

          <div className="pt-2">
            <Button type="submit" variant="default" disabled={mutation.isPending}>
              {mutation.isPending ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PortalProfile;
