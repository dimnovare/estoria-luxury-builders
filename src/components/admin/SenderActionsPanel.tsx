import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Briefcase, Link as LinkIcon, User, Check, Loader2, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useContacts, useCreateContact, useDeals } from '@/hooks/api/useCrm';
import { useLinkMessage, type InboxMessageDetail } from '@/hooks/api/useInbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  message: InboxMessageDetail;
}

export default function SenderActionsPanel({ message }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const linkMut = useLinkMessage();
  const createContact = useCreateContact();

  // Look up an existing contact by email
  const { data: existingByEmail } = useContacts({ search: message.from, pageSize: 1 });
  const matchedContact = useMemo(() => {
    const items = existingByEmail?.items ?? [];
    return items.find((c) => (c.email ?? '').toLowerCase() === message.from.toLowerCase()) ?? null;
  }, [existingByEmail, message.from]);

  const [openPanel, setOpenPanel] = useState<null | 'contact' | 'deal'>(null);
  const [contactQuery, setContactQuery] = useState('');
  const [dealQuery, setDealQuery] = useState('');
  const debouncedContact = useDebouncedValue(contactQuery, 250);
  const debouncedDeal = useDebouncedValue(dealQuery, 250);

  const { data: contactSearch } = useContacts(
    debouncedContact ? { search: debouncedContact, pageSize: 8 } : { pageSize: 0 },
  );
  const { data: dealsByStage } = useDeals();
  const dealMatches = useMemo(() => {
    if (!debouncedDeal) return [];
    const all = Object.values(dealsByStage ?? {}).flat();
    const q = debouncedDeal.toLowerCase();
    return all.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 8);
  }, [dealsByStage, debouncedDeal]);

  const handleCreateContact = async () => {
    try {
      const created = await createContact.mutateAsync({
        fullName: message.fromName || message.from,
        email: message.from,
      }) as { id: string };
      toast.success(t('admin.inbox.actions.contactCreated', { defaultValue: 'Contact created' }));
      // Auto-link to this thread
      await linkMut.mutateAsync({ id: message.id, payload: { contactId: created.id } });
    } catch {
      toast.error(t('admin.inbox.actions.contactCreateFailed', { defaultValue: 'Failed to create contact' }));
    }
  };

  const handleCreateDeal = () => {
    const params = new URLSearchParams({
      title: message.subject,
      messageId: message.id,
    });
    if (matchedContact) params.set('contactId', matchedContact.id);
    navigate(`/admin/deals?new=1&${params.toString()}`);
  };

  const handleLinkContact = (contactId: string) => {
    linkMut.mutate({ id: message.id, payload: { contactId } });
    setOpenPanel(null);
    setContactQuery('');
  };

  const handleLinkDeal = (dealId: string) => {
    linkMut.mutate({ id: message.id, payload: { dealId } });
    setOpenPanel(null);
    setDealQuery('');
  };

  const handleUnlink = (kind: 'contact' | 'deal') => {
    linkMut.mutate({
      id: message.id,
      payload: kind === 'contact' ? { contactId: null } : { dealId: null },
    });
  };

  const linkedContactId = message.linkedContactId;
  const linkedDealId = message.linkedDealId;

  const btnClass =
    'w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-md hover:bg-[hsl(43_50%_95%)] text-[hsl(0_0%_25%)] border border-[hsl(0_0%_88%)] bg-white transition-colors';

  return (
    <aside className="md:w-64 md:border-l md:border-[hsl(0_0%_90%)] bg-[hsl(0_0%_97%)] p-3 md:p-4 shrink-0 overflow-y-auto">
      {/* Sender */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(0_0%_45%)] mb-2">
          {t('admin.inbox.actions.sender', { defaultValue: 'Sender' })}
        </p>
        <p className="text-sm font-medium text-[hsl(0_0%_20%)] truncate">{message.fromName || message.from}</p>
        <p className="text-xs text-[hsl(0_0%_50%)] truncate">{message.from}</p>
      </div>

      <div className="space-y-2">
        {/* Contact action */}
        {matchedContact || linkedContactId ? (
          <div className="border border-[hsl(43_50%_75%)] bg-[hsl(43_50%_97%)] rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_25%)]">
              <Check className="h-3.5 w-3.5 text-[hsl(43_50%_45%)] shrink-0" />
              <button
                onClick={() => navigate(`/admin/contacts/${linkedContactId ?? matchedContact!.id}`)}
                className="flex-1 text-left truncate hover:underline"
              >
                {message.linkedContactName ?? matchedContact?.fullName}
              </button>
              {linkedContactId && (
                <button onClick={() => handleUnlink('contact')} title="Unlink" className="text-[hsl(0_0%_50%)] hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleCreateContact}
            disabled={createContact.isPending}
            className={btnClass}
          >
            {createContact.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            <span>{t('admin.inbox.actions.createContact', { defaultValue: 'Create Contact' })}</span>
          </button>
        )}

        {/* Deal create */}
        <button onClick={handleCreateDeal} className={btnClass}>
          <Briefcase className="h-3.5 w-3.5" />
          <span>{t('admin.inbox.actions.createDeal', { defaultValue: 'Create Deal' })}</span>
        </button>

        {/* Link to existing deal */}
        {linkedDealId ? (
          <div className="border border-[hsl(43_50%_75%)] bg-[hsl(43_50%_97%)] rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_25%)]">
              <Check className="h-3.5 w-3.5 text-[hsl(43_50%_45%)] shrink-0" />
              <button
                onClick={() => navigate(`/admin/deals/${linkedDealId}`)}
                className="flex-1 text-left truncate hover:underline"
              >
                {message.linkedDealTitle ?? 'Linked deal'}
              </button>
              <button onClick={() => handleUnlink('deal')} title="Unlink" className="text-[hsl(0_0%_50%)] hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setOpenPanel(openPanel === 'deal' ? null : 'deal')}
              className={cn(btnClass, openPanel === 'deal' && 'bg-[hsl(43_50%_95%)]')}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>{t('admin.inbox.actions.linkDeal', { defaultValue: 'Link to Existing Deal' })}</span>
            </button>
            {openPanel === 'deal' && (
              <div className="border border-[hsl(0_0%_88%)] rounded-md bg-white p-2 space-y-1">
                <Input
                  autoFocus
                  value={dealQuery}
                  onChange={(e) => setDealQuery(e.target.value)}
                  placeholder="Search deals..."
                  className="h-8 text-sm"
                />
                {dealMatches.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleLinkDeal(d.id)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[hsl(43_50%_95%)] text-[hsl(0_0%_25%)] truncate"
                  >
                    {d.title}
                  </button>
                ))}
                {debouncedDeal && dealMatches.length === 0 && (
                  <p className="text-xs text-[hsl(0_0%_55%)] px-2 py-1">No matches</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Link to existing contact */}
        {!linkedContactId && (
          <>
            <button
              onClick={() => setOpenPanel(openPanel === 'contact' ? null : 'contact')}
              className={cn(btnClass, openPanel === 'contact' && 'bg-[hsl(43_50%_95%)]')}
            >
              <User className="h-3.5 w-3.5" />
              <span>{t('admin.inbox.actions.linkContact', { defaultValue: 'Link to Existing Contact' })}</span>
            </button>
            {openPanel === 'contact' && (
              <div className="border border-[hsl(0_0%_88%)] rounded-md bg-white p-2 space-y-1">
                <Input
                  autoFocus
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="h-8 text-sm"
                />
                {(contactSearch?.items ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleLinkContact(c.id)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[hsl(43_50%_95%)] text-[hsl(0_0%_25%)] truncate"
                  >
                    {c.fullName} <span className="text-[hsl(0_0%_55%)]">{c.email}</span>
                  </button>
                ))}
                {debouncedContact && (contactSearch?.items?.length ?? 0) === 0 && (
                  <p className="text-xs text-[hsl(0_0%_55%)] px-2 py-1">No matches</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
