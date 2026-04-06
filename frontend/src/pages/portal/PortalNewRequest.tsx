import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, DatePicker, Upload, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { portalRequestService } from '../../api/services/portal';
import { Button } from '../../components/ui/button';

const { TextArea } = Input;
const { Dragger } = Upload;

interface RequestFormValues {
  title: string;
  source_language: string;
  target_language: string;
  deadline?: any; // dayjs object
  notes?: string;
}

const PortalNewRequest: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<RequestFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const mutation = useMutation({
    mutationFn: portalRequestService.create,
    onSuccess: () => {
      toast.success('Ihre Anfrage wurde erfolgreich übermittelt.');
      navigate('/portal/projects');
    },
    onError: () => {
      // errors handled by interceptor
    },
  });

  const handleSubmit = async (values: RequestFormValues) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('source_language', values.source_language);
    formData.append('target_language', values.target_language);
    if (values.deadline) {
      formData.append('deadline', values.deadline.format('YYYY-MM-DD'));
    }
    if (values.notes) {
      formData.append('notes', values.notes);
    }
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('files[]', file.originFileObj);
      }
    });
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Neue Anfrage</h1>
        <p className="text-slate-500 text-sm mt-1">
          Senden Sie uns eine Übersetzungsanfrage. Wir melden uns schnellstmöglich.
        </p>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white max-w-2xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          disabled={mutation.isPending}
        >
          <Form.Item
            name="title"
            label="Projekttitel"
            rules={[{ required: true, message: 'Bitte geben Sie einen Projekttitel ein.' }]}
          >
            <Input placeholder="z. B. Übersetzung Jahresbericht 2025" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="source_language"
              label="Quellsprache"
              rules={[{ required: true, message: 'Bitte geben Sie die Quellsprache an.' }]}
            >
              <Input placeholder="z. B. Deutsch" />
            </Form.Item>

            <Form.Item
              name="target_language"
              label="Zielsprache"
              rules={[{ required: true, message: 'Bitte geben Sie die Zielsprache an.' }]}
            >
              <Input placeholder="z. B. Englisch" />
            </Form.Item>
          </div>

          <Form.Item name="deadline" label="Wunschdeadline (optional)">
            <DatePicker
              className="w-full"
              format="DD.MM.YYYY"
              placeholder="Datum auswählen"
              disabledDate={(d) => d.isBefore(new Date(), 'day')}
            />
          </Form.Item>

          <Form.Item name="notes" label="Anmerkungen (optional)">
            <TextArea
              rows={4}
              placeholder="Besondere Anforderungen, Kontext oder weitere Informationen..."
            />
          </Form.Item>

          <Form.Item label="Dateien anhängen (optional)">
            <Dragger
              multiple
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newList }) => setFileList(newList)}
              accept="*/*"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text text-sm">
                Dateien hier ablegen oder <span className="text-teal-600">auswählen</span>
              </p>
              <p className="ant-upload-hint text-xs text-slate-400">
                Alle Dateiformate werden akzeptiert. Mehrere Dateien möglich.
              </p>
            </Dragger>
          </Form.Item>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="default"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Wird übermittelt...' : 'Anfrage absenden'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/portal/projects')}
              disabled={mutation.isPending}
            >
              Abbrechen
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PortalNewRequest;
