import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import { ArrowRight, FileText, MessageSquare, PlusCircle, FolderKanban, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { portalDashboardService } from '../../api/services/portal';
import { usePortal } from '../../context/PortalContext';
import type { PortalInvoice, PortalProject } from '../../types/portal';

const formatCents = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

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

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf',
  issued: 'Ausgestellt',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
  overdue: 'Überfällig',
};

const ActionCard: React.FC<{
  to: string;
  title: string;
  copy: string;
  icon: React.ReactNode;
}> = ({ to, title, copy, icon }) => (
  <Link
    to={to}
    className="border border-slate-300 bg-white px-5 py-5 transition hover:border-[#0e5a67] hover:bg-[#f9fbfc]"
  >
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center bg-[#e2ebf2] text-[#0e5a67]">
      {icon}
    </div>
    <div className="mb-2 text-base font-medium text-slate-900">{title}</div>
    <p className="text-sm leading-6 text-slate-600">{copy}</p>
  </Link>
);

const PortalDashboard: React.FC = () => {
  const { customer } = usePortal();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: portalDashboardService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" tip="Wird geladen..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        message="Die Portalansicht konnte nicht geladen werden."
        showIcon
        className="max-w-xl"
      />
    );
  }

  const { stats, recent_projects, recent_invoices } = data;
  const displayName = customer?.company_name || customer?.first_name || 'Portal';
  const nextProject = recent_projects[0];
  const nextInvoice = recent_invoices[0];

  return (
    <div className="space-y-6">
      <section className="border border-white/20 bg-white/10 px-6 py-6 sm:px-8">
        <div className="max-w-3xl">
          <div className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-white/70">Start</div>
          <h1 className="text-3xl font-normal tracking-tight text-white">
            Guten Tag, {displayName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Hier finden Sie die wichtigsten Bereiche für Ihr Serviceportal. Sie können Projekte einsehen, Dateien und Nachrichten prüfen, Rechnungen herunterladen, neue Anfragen senden und Ihre Kontaktdaten pflegen.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          to="/portal/projects"
          title="Meine Projekte"
          copy="Projektstatus, Dateien, Rückfragen und Liefertermine übersichtlich einsehen."
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <ActionCard
          to="/portal/invoices"
          title="Rechnungen"
          copy="Offene und abgeschlossene Rechnungen ansehen und PDF-Dateien herunterladen."
          icon={<FileText className="h-5 w-5" />}
        />
        <ActionCard
          to="/portal/new-request"
          title="Neue Anfrage"
          copy="Neue Übersetzungs- oder Serviceanfragen direkt im Portal an das Team senden."
          icon={<PlusCircle className="h-5 w-5" />}
        />
        <ActionCard
          to="/portal/profile"
          title="Mein Profil"
          copy="Kontaktdaten, Anschrift und weitere wichtige Stammdaten prüfen und aktualisieren."
          icon={<UserRound className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-base font-medium text-slate-900">Wichtige Hinweise</div>
          </div>
          <div className="grid gap-0">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="mb-1 text-sm font-medium text-slate-900">Projekte und Rückfragen</div>
              <p className="text-sm leading-6 text-slate-600">
                Wenn Sie zu einem Projekt eine Rückfrage haben oder Dateien nachreichen möchten, öffnen Sie bitte das jeweilige Projekt. Dort finden Sie Nachrichten, Dateibereich und Statusinformationen an einem Ort.
              </p>
            </div>
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="mb-1 text-sm font-medium text-slate-900">Rechnungen und Dokumente</div>
              <p className="text-sm leading-6 text-slate-600">
                Im Bereich Rechnungen können Sie aktuelle Dokumente einsehen und herunterladen. Falls Angaben fehlen, wenden Sie sich bitte direkt an Ihren Projektmanager.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="mb-1 text-sm font-medium text-slate-900">Profil und Kontaktdaten</div>
              <p className="text-sm leading-6 text-slate-600">
                Bitte halten Sie Ihre E-Mail-Adresse, Telefonnummer und Anschrift aktuell. So vermeiden Sie Rückfragen und Verzögerungen bei Projekten und Abrechnungen.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-slate-300 bg-white px-5 py-4">
            <div className="mb-3 text-base font-medium text-slate-900">Ihr aktueller Stand</div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span>Offene Projekte</span>
                <span className="font-medium text-slate-900">{stats.open_projects}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span>Abgeschlossene Projekte</span>
                <span className="font-medium text-slate-900">{stats.completed_projects}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span>Offene Rechnungen</span>
                <span className="font-medium text-slate-900">{stats.unpaid_invoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Offene Nachrichten</span>
                <span className="font-medium text-slate-900">{stats.open_messages}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 bg-white px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-base font-medium text-slate-900">Nächstes Projekt</div>
              <Link to="/portal/projects" className="text-sm text-[#0e5a67] hover:underline">
                Projekte öffnen
              </Link>
            </div>
            {nextProject ? (
              <div className="space-y-2 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{nextProject.title}</div>
                <div>Status: {statusLabel[nextProject.status] ?? nextProject.status}</div>
                {nextProject.deadline && <div>Termin: {new Date(nextProject.deadline).toLocaleDateString('de-DE')}</div>}
                {(nextProject.source_language || nextProject.target_language) && (
                  <div>
                    Sprachen: {nextProject.source_language ?? '-'} nach {nextProject.target_language ?? '-'}
                  </div>
                )}
                <Link to={`/portal/projects/${nextProject.id}`} className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-[#0e5a67] hover:underline">
                  Projekt ansehen <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">Derzeit sind keine Projekte im Portal sichtbar.</p>
            )}
          </div>

          <div className="border border-slate-300 bg-white px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-base font-medium text-slate-900">Letzte Rechnung</div>
              <Link to="/portal/invoices" className="text-sm text-[#0e5a67] hover:underline">
                Rechnungen öffnen
              </Link>
            </div>
            {nextInvoice ? (
              <div className="space-y-2 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{nextInvoice.invoice_number}</div>
                <div>Status: {invoiceStatusLabel[nextInvoice.status] ?? nextInvoice.status}</div>
                <div>Betrag: {formatCents(nextInvoice.amount_gross)}</div>
                <div>Datum: {new Date(nextInvoice.date).toLocaleDateString('de-DE')}</div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">Derzeit ist keine Rechnung im Portal vorhanden.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border border-white/20 bg-white/10 px-6 py-5">
        <div className="mb-2 flex items-center gap-2 text-base font-medium text-white">
          <MessageSquare className="h-5 w-5 text-white/70" />
          <span>Was Sie hier direkt erledigen können</span>
        </div>
        <div className="grid gap-2 text-sm leading-6 text-white/80 md:grid-cols-2">
          <div>Projektstatus prüfen und Dateien herunterladen</div>
          <div>Rückfragen direkt am Projekt senden</div>
          <div>Neue Anfrage an das Team übermitteln</div>
          <div>Rechnungen einsehen und speichern</div>
        </div>
      </section>
    </div>
  );
};

export default PortalDashboard;
