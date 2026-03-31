import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FaCheckCircle, FaClock, FaSpinner } from 'react-icons/fa';
import { partnerService } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import DataTable from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/button';

interface PartnerBillingTabProps {
    partnerId: number;
}

interface BillingProject {
    id: number;
    project_number: string;
    project_name: string;
    deadline: string | null;
    partner_cost_net: number;
    status: string;
    partner_paid: boolean;
}

interface BillingData {
    total_owed_net: number;
    total_paid_net: number;
    total_outstanding_net: number;
    projects: BillingProject[];
}

const fmt = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
        return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
        return '—';
    }
};

// ── Summary Card ─────────────────────────────────────────────────────────
interface SummaryCardProps {
    label: string;
    value: string;
    accent?: 'neutral' | 'green' | 'amber';
}

const SummaryCard = ({ label, value, accent = 'neutral' }: SummaryCardProps) => {
    const valueClass =
        accent === 'green'
            ? 'text-emerald-700'
            : accent === 'amber'
                ? 'text-amber-600'
                : 'text-slate-800';

    return (
        <div className="rounded-sm border border-slate-200 bg-white p-4">
            <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
            <span className={`block text-2xl font-bold ${valueClass}`}>{value}</span>
        </div>
    );
};

// ── Toggle Pay Button ─────────────────────────────────────────────────────
interface TogglePayButtonProps {
    partnerId: number;
    project: BillingProject;
}

const TogglePayButton = ({ partnerId, project }: TogglePayButtonProps) => {
    const queryClient = useQueryClient();

    const toggleMutation = useMutation({
        mutationFn: () => partnerService.markProjectPaid(partnerId, project.id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.partners.billing(partnerId),
            });
        },
    });

    return (
        <Button
            variant={project.partner_paid ? 'secondary' : 'success'}
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
        >
            {toggleMutation.isPending ? (
                <FaSpinner className="animate-spin text-xs" />
            ) : project.partner_paid ? (
                <FaClock className="text-xs" />
            ) : (
                <FaCheckCircle className="text-xs" />
            )}
            {project.partner_paid ? 'Als unbezahlt markieren' : 'Als bezahlt markieren'}
        </Button>
    );
};

// ── Main Component ────────────────────────────────────────────────────────
const PartnerBillingTab = ({ partnerId }: PartnerBillingTabProps) => {
    const { data, isLoading } = useQuery<BillingData>({
        queryKey: queryKeys.partners.billing(partnerId),
        queryFn: () => partnerService.getPartnerBilling(partnerId),
        enabled: !!partnerId,
    });

    const projects: BillingProject[] = data?.projects ?? [];

    const totalAssigned = (data?.total_owed_net ?? 0) + (data?.total_paid_net ?? 0);
    const totalPaid = data?.total_paid_net ?? 0;
    const totalOutstanding = data?.total_outstanding_net ?? 0;

    const columns = [
        {
            id: 'projekt',
            header: 'Projekt',
            accessor: (item: BillingProject) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-500">{item.project_number}</span>
                    <span className="text-sm font-medium text-slate-800">{item.project_name || '—'}</span>
                </div>
            ),
        },
        {
            id: 'deadline',
            header: 'Abgabedatum',
            accessor: (item: BillingProject) => (
                <span className="text-sm text-slate-600">{formatDate(item.deadline)}</span>
            ),
            sortKey: 'deadline',
            sortable: true,
        },
        {
            id: 'betrag',
            header: 'Betrag netto',
            align: 'right' as const,
            accessor: (item: BillingProject) => (
                <span className="text-sm font-medium text-slate-800 tabular-nums">
                    {fmt(item.partner_cost_net ?? 0)}
                </span>
            ),
            sortKey: 'partner_cost_net',
            sortable: true,
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (item: BillingProject) => (
                <StatusBadge status={item.status} type="project" />
            ),
        },
        {
            id: 'bezahlstatus',
            header: 'Bezahlstatus',
            accessor: (item: BillingProject) =>
                item.partner_paid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 tracking-tight">
                        <FaCheckCircle className="text-emerald-500 text-xs" />
                        Bezahlt
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 tracking-tight">
                        <FaClock className="text-amber-500 text-xs" />
                        Offen
                    </span>
                ),
        },
        {
            id: 'aktionen',
            header: 'Aktionen',
            align: 'right' as const,
            accessor: (item: BillingProject) => (
                <TogglePayButton partnerId={partnerId} project={item} />
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard
                    label="Gesamtforderung"
                    value={fmt(totalAssigned)}
                    accent="neutral"
                />
                <SummaryCard
                    label="Bezahlt"
                    value={fmt(totalPaid)}
                    accent="green"
                />
                <SummaryCard
                    label="Offen"
                    value={fmt(totalOutstanding)}
                    accent={totalOutstanding > 0 ? 'amber' : 'green'}
                />
            </div>

            {/* Projects Table */}
            <DataTable
                data={projects}
                columns={columns}
                isLoading={isLoading}
                searchPlaceholder="Projekte durchsuchen..."
                searchFields={['project_number', 'project_name'] as (keyof BillingProject)[]}
                pageSize={25}
                showSettings={false}
            />
        </div>
    );
};

export default PartnerBillingTab;
