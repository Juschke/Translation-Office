import React, { useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Tag, Spin, Alert, Form, Input, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  FileOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalProjectService } from '../../api/services/portal';
import { Button } from '../../components/ui/button';
import type { PortalMessage } from '../../types/portal';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  pending: 'In Bearbeitung',
  offer: 'Angebot',
  quote_sent: 'Angebot versandt',
  in_progress: 'In Bearbeitung',
  review: 'In Prüfung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const statusColor: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  offer: 'gold',
  quote_sent: 'blue',
  in_progress: 'processing',
  review: 'purple',
  completed: 'success',
  cancelled: 'error',
};

const formatCents = (cents?: number) =>
  cents != null ? (cents / 100).toFixed(2) + ' €' : '—';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PortalProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['portal-project', id],
    queryFn: () => portalProjectService.getById(id!),
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => portalProjectService.sendMessage(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-project', id] });
      form.resetFields();
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [project?.messages?.length]);

  const handleSend = async (values: { body: string }) => {
    if (!values.body?.trim()) return;
    sendMutation.mutate(values.body.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" tip="Wird geladen..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          to="/portal/projects"
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm"
        >
          <ArrowLeftOutlined /> Zurück zu Projekten
        </Link>
        <Alert type="error" message="Projekt konnte nicht geladen werden." showIcon />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/portal/projects"
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          <ArrowLeftOutlined /> Zurück
        </Link>
      </div>

      {/* Project Info */}
      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{project.title}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Erstellt am {new Date(project.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Tag color={statusColor[project.status] ?? 'default'} className="text-sm px-3 py-1 self-start">
            {statusLabel[project.status] ?? project.status}
          </Tag>
        </div>

        <Divider className="my-4" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
              Quellsprache
            </div>
            <div className="text-sm text-slate-700">{project.source_language ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
              Zielsprache
            </div>
            <div className="text-sm text-slate-700">{project.target_language ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
              Deadline
            </div>
            <div className="text-sm text-slate-700">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('de-DE')
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
              Betrag
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {formatCents(project.price)}
            </div>
          </div>
        </div>

        {project.notes && (
          <>
            <Divider className="my-4" />
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                Anmerkungen
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{project.notes}</p>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Files */}
        <Card
          className="rounded-xl border border-slate-200 shadow-sm bg-white"
          title={<span className="font-semibold text-slate-700">Projektdateien</span>}
          styles={{ body: { padding: 0 } }}
        >
          {!project.files || project.files.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Noch keine Dateien vorhanden.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {project.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <FileOutlined className="text-teal-600 text-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-700 truncate">{file.name}</div>
                    <div className="text-xs text-slate-400">
                      {formatBytes(file.size)} &middot;{' '}
                      {new Date(file.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Messages */}
        <Card
          className="rounded-xl border border-slate-200 shadow-sm bg-white flex flex-col"
          title={<span className="font-semibold text-slate-700">Nachrichten</span>}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto max-h-80 px-4 py-3 space-y-3">
            {!project.messages || project.messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                Noch keine Nachrichten. Starten Sie die Konversation.
              </div>
            ) : (
              project.messages.map((msg: PortalMessage) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 ${isCustomer
                          ? 'bg-teal-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}
                    >
                      <div className="text-xs font-semibold mb-1 opacity-75 flex items-center gap-1">
                        {isCustomer ? (
                          <UserOutlined />
                        ) : (
                          <TeamOutlined />
                        )}
                        {msg.sender_name}
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.body}</p>
                      <div className={`text-xs mt-1 ${isCustomer ? 'text-teal-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Form */}
          <div className="border-t border-slate-200 px-4 py-3">
            <Form form={form} onFinish={handleSend}>
              <div className="flex gap-2">
                <Form.Item name="body" className="flex-1 mb-0">
                  <Input.TextArea
                    placeholder="Nachricht eingeben..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        form.submit();
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Button
                    type="submit"
                    variant="default"
                    className="h-full px-3"
                    disabled={sendMutation.isPending}
                    title="Senden"
                  >
                    <SendOutlined />
                  </Button>
                </Form.Item>
              </div>
              <p className="text-xs text-slate-400 mt-1">Enter zum Senden, Shift+Enter für neue Zeile</p>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortalProjectDetail;
