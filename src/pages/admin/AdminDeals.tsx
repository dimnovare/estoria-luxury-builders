import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar, DollarSign, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/admin/EmptyState';
import {
  useDeals, useChangeStage, useAgents, handleCrmError,
  DEAL_STAGES, type DealStage, type DealListDto, type DealFilter,
  type DealType, type DealSide,
} from '@/hooks/api/useCrm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const stageColors: Record<string, string> = {
  Lead: 'bg-gray-100 text-gray-700 border-gray-200',
  Qualified: 'bg-blue-50 text-blue-700 border-blue-200',
  Viewing: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Offer: 'bg-amber-50 text-amber-700 border-amber-200',
  Negotiation: 'bg-orange-50 text-orange-700 border-orange-200',
  ContractSigned: 'bg-purple-50 text-purple-700 border-purple-200',
  ClosingPending: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Won: 'bg-green-50 text-green-700 border-green-200',
  Lost: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminDeals() {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();

  const [agentFilter, setAgentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);

  // Stage change modal state
  const [changingDeal, setChangingDeal] = useState<DealListDto | null>(null);
  const [targetStage, setTargetStage] = useState<DealStage | ''>('');
  const [actualValue, setActualValue] = useState('');
  const [lossReason, setLossReason] = useState('');

  const { data: agentsData } = useAgents();
  const agents = agentsData ?? [];

  const filter: DealFilter = {
    agentId: agentFilter !== 'all' ? agentFilter : undefined,
    dealType: typeFilter !== 'all' ? (typeFilter as DealType) : undefined,
    side: sideFilter !== 'all' ? (sideFilter as DealSide) : undefined,
    mineOnly: mineOnly || undefined,
  };

  const { data: kanban, isLoading } = useDeals(filter);
  const changeStage = useChangeStage();

  const openStageChange = (deal: DealListDto) => {
    setChangingDeal(deal);
    setTargetStage('');
    setActualValue('');
    setLossReason('');
  };

  const handleStageChange = async () => {
    if (!changingDeal || !targetStage) return;
    if (targetStage === 'Won') {
      const v = parseFloat(actualValue);
      if (!Number.isFinite(v) || v <= 0) {
        toast.error(t('admin.deals.toast.actualValueRequired'));
        return;
      }
    }
    if (targetStage === 'Lost' && lossReason.trim().length < 5) {
      toast.error(t('admin.deals.toast.lossReasonRequired'));
      return;
    }
    try {
      await changeStage.mutateAsync({
        id: changingDeal.id,
        stage: targetStage,
        actualValue: targetStage === 'Won' ? parseFloat(actualValue) : undefined,
        lossReason: targetStage === 'Lost' ? lossReason.trim() : undefined,
      });
      toast.success(t('admin.deals.toast.stageChanged'));
      setChangingDeal(null);
    } catch (err) {
      handleCrmError(err, t('admin.deals.toast.stageChangeFailed'));
    }
  };

  const getDaysInStage = (deal: DealListDto) => {
    const days = Math.floor((Date.now() - new Date(deal.stageChangedAt).getTime()) / 86400000);
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.deals.title')}</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Link to="/admin/deals/new"><Plus className="h-4 w-4 mr-2" />{t('admin.deals.addNew')}</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.contacts.filters.agent')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.deals.filters.dealType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              <SelectItem value="Sale">{t('admin.deals.dealTypes.Sale')}</SelectItem>
              <SelectItem value="Rent">{t('admin.deals.dealTypes.Rent')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-[140px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.deals.filters.side')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              <SelectItem value="BuySide">{t('admin.deals.sides.BuySide')}</SelectItem>
              <SelectItem value="SellSide">{t('admin.deals.sides.SellSide')}</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setMineOnly(!mineOnly)}
            className={`px-3 py-1.5 text-xs font-nav uppercase tracking-wider rounded-full border transition-colors ${
              mineOnly
                ? 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] border-[hsl(43_50%_54%)]'
                : 'border-[hsl(0_0%_85%)] text-[hsl(0_0%_50%)] hover:border-[hsl(0_0%_70%)]'
            }`}
          >
            {t('admin.deals.filters.mineOnly')}
          </button>
        </CardContent>
      </Card>

      {/* Kanban Board — outer w-full max-w-full overflow-hidden traps the
          horizontal overflow inside the page so the header stays anchored at
          viewport width. The inner overflow-x-auto then scrolls within that
          frame; w-max instead of min-w-max prevents the parent from getting
          stretched. */}
      <div className="w-full max-w-full overflow-hidden">
      {isLoading ? (
        <div className="overflow-x-auto pb-4 w-full">
          <div className="flex gap-4 w-max">
            {DEAL_STAGES.map(stage => (
              <div key={stage} className="w-[280px] shrink-0">
                <div className="bg-[hsl(0_0%_96%)] rounded-t-lg px-3 py-2.5 border border-b-0 border-[hsl(0_0%_90%)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_40%)]">
                      {t(`admin.deals.stages.${stage}`)}
                    </span>
                    <Skeleton className="h-4 w-6" />
                  </div>
                </div>
                <div className="bg-[hsl(0_0%_97%)] border border-t-0 border-[hsl(0_0%_90%)] rounded-b-lg p-2 space-y-2 min-h-[120px]">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
                      <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 w-full">
          <div className="flex gap-4 w-max">
            {DEAL_STAGES.map(stage => {
              const deals = kanban?.[stage] ?? [];
              const totalValue = deals.reduce((sum, d) => sum + (d.expectedValue ?? 0), 0);
              return (
                <div key={stage} className="w-[280px] shrink-0">
                  <div className="bg-[hsl(0_0%_96%)] rounded-t-lg px-3 py-2.5 border border-b-0 border-[hsl(0_0%_90%)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_40%)]">
                        {t(`admin.deals.stages.${stage}`)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{deals.length}</Badge>
                    </div>
                    {totalValue > 0 && (
                      <p className="text-xs text-[hsl(0_0%_50%)] mt-0.5">€{totalValue.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="bg-[hsl(0_0%_97%)] border border-t-0 border-[hsl(0_0%_90%)] rounded-b-lg p-2 space-y-2 min-h-[120px]">
                    {deals.length === 0 && (
                      <EmptyState
                        compact
                        icon={Briefcase}
                        title={t('admin.deals.kanbanEmpty')}
                      />
                    )}
                    {deals.map(deal => {
                      const daysInStage = getDaysInStage(deal);
                      return (
                        <Card key={deal.id} className="bg-white border-[hsl(0_0%_90%)] shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openStageChange(deal)}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <Link to={`/admin/deals/${deal.id}`} className="text-sm font-medium text-[hsl(0_0%_20%)] hover:text-[hsl(43_50%_54%)]" onClick={(e) => e.stopPropagation()}>
                                {deal.title}
                              </Link>
                            </div>
                            <Link to={`/admin/contacts/${deal.primaryContactId}`} className="text-xs text-[hsl(0_0%_50%)] hover:text-[hsl(43_50%_54%)]" onClick={(e) => e.stopPropagation()}>
                              {deal.primaryContactName}
                            </Link>
                            {deal.propertyThumbUrl && (
                              <img src={deal.propertyThumbUrl} alt="" className="h-12 w-full object-cover rounded" />
                            )}
                            <div className="flex items-center justify-between text-xs">
                              {deal.expectedValue && (
                                <span className="text-[hsl(0_0%_30%)] font-medium">€{deal.expectedValue.toLocaleString()}</span>
                              )}
                              {deal.expectedCloseDate && (
                                <span className="text-[hsl(0_0%_60%)] flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[hsl(0_0%_60%)]">{deal.assignedAgentName}</span>
                              {daysInStage > 0 && (
                                <Badge variant="outline" className={`text-[10px] ${
                                  daysInStage > 30 ? 'bg-red-50 text-red-600 border-red-200'
                                    : daysInStage > 14 ? 'bg-[hsl(43_50%_54%)]/10 text-[hsl(43_50%_44%)] border-[hsl(43_50%_54%)]/30'
                                    : 'text-[hsl(0_0%_60%)]'
                                }`}>
                                  <Clock className="h-2.5 w-2.5 mr-0.5" />{daysInStage}d
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Stage Change Modal */}
      <Dialog open={!!changingDeal} onOpenChange={() => setChangingDeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deals.changeStage')}: {changingDeal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.deals.currentStage')}</Label>
              <Badge variant="outline" className={`mt-1 ${stageColors[changingDeal?.stage ?? ''] ?? ''}`}>
                {changingDeal?.stage && t(`admin.deals.stages.${changingDeal.stage}`)}
              </Badge>
            </div>
            <div>
              <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.deals.newStage')}</Label>
              <Select value={targetStage} onValueChange={(v) => setTargetStage(v as DealStage)}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue placeholder={t('admin.deals.selectStage')} />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.filter(s => s !== changingDeal?.stage).map(s => (
                    <SelectItem key={s} value={s}>{t(`admin.deals.stages.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {targetStage === 'Won' && (
              <div>
                <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.deals.fields.actualValue')} *</Label>
                <Input value={actualValue} onChange={(e) => setActualValue(e.target.value)} type="number" className="mt-1 bg-secondary border-border" />
              </div>
            )}
            {targetStage === 'Lost' && (
              <div>
                <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.deals.fields.lossReason')} *</Label>
                <Textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="mt-1 bg-secondary border-border" rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangingDeal(null)}>{t('admin.common.cancel')}</Button>
            <Button
              className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]"
              onClick={handleStageChange}
              disabled={!targetStage || changeStage.isPending}
            >
              {t('admin.deals.confirmStageChange')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
