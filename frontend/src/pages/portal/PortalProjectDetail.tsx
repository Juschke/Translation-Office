import React, { useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Tag, Spin, Alert, Form, Input, Divider } from 'antd';
import { ArrowLeft, FileText, Send, User, Users } from 'lucide-react';
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

const formatCents = (cents?: number) => (cents != null ? `${(cents / 100).toFixed(2)} €` : '—');

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <Link to="/portal/projects" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Zurück zu Projekten
        </Link>
        <Alert type="error" message="Projekt konnte nicht geladen werden." showIcon />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/portal/projects" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{project.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Erstellt am {new Date(project.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Tag color={statusColor[project.status] ?? 'default'} className="self-start px-3 py-1 text-sm">
            {statusLabel[project.status] ?? project.status}
          </Tag>
        </div>

        <Divider className="my-4" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Quellsprache</div>
            <div className="text-sm text-slate-700">{project.source_language ?? '—'}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Zielsprache</div>
            <div className="text-sm text-slate-700">{project.target_language ?? '—'}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Deadline</div>
            <div className="text-sm text-slate-700">{project.deadline ? new Date(project.deadline).toLocaleDateString('de-DE') : '—'}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Betrag</div>
            <div className="text-sm font-semibold text-slate-700">{formatCents(project.price)}</div>
          </div>
        </div>

        {project.notes && (
          <>
            <Divider className="my-4" />
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Anmerkungen</div>
              <p className="whitespace-pre-line text-sm text-slate-700">{project.notes}</p>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          className="rounded-xl border border-slate-200 shadow-sm bg-white"
          title={<span className="font-semibold text-slate-700">Projektdateien</span>}
          styles={{ body: { padding: 0 } }}
        >
          {!project.files || project.files.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Noch keine Dateien vorhanden.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {project.files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-teal-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-700">{file.name}</div>
                    <div className="text-xs text-slate-400">
                      {formatBytes(file.size)} · {new Date(file.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          className="flex flex-col rounded-xl border border-slate-200 shadow-sm bg-white"
          title={<span className="font-semibold text-slate-700">Nachrichten</span>}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
          <div className="max-h-80 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {!project.messages || project.messages.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Noch keine Nachrichten. Starten Sie die Konversation.</div>
            ) : (
              project.messages.map((msg: PortalMessage) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${isCustomer ? 'rounded-br-sm bg-teal-600 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800'}`}>
                      <div className="mb-1 flex items-center gap-1 text-xs font-semibold opacity-75">
                        {isCustomer ? <User className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                        {msg.sender_name}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.body}</p>
                      <div className={`mt-1 text-xs ${isCustomer ? 'text-teal-200' : 'text-slate-400'}`}>
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

          <div className="border-t border-slate-200 px-4 py-3">
            <Form form={form} onFinish={handleSend}>
              <div className="flex gap-2">
                <Form.Item name="body" className="mb-0 flex-1">
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
                  <Button type="submit" variant="default" className="h-full px-3" disabled={sendMutation.isPending} title="Senden">
                    <Send className="h-4 w-4" />
                  </Button>
                </Form.Item>
              </div>
              <p className="mt-1 text-xs text-slate-400">Enter zum Senden, Shift+Enter für neue Zeile</p>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortalProjectDetail;
