import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUser, useCreateUser, useUpdateUser } from '@/hooks/api/useAdminUsers';
import { useAdminTeam } from '@/hooks/api/useAdmin';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

const ROLE_VALUES = ['Admin', 'Agent', 'Editor', 'Marketing'] as const;
const LANGUAGE_VALUES = ['ET', 'EN', 'RU'] as const;

export default function UserForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: loadingUser } = useAdminUser(isEdit ? id : undefined);
  const { data: teamData } = useAdminTeam();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [teamMemberId, setTeamMemberId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (existing) {
      setEmail(existing.email);
      setFullName(existing.fullName);
      setPhone(existing.phone ?? '');
      setPhotoUrl(existing.photoUrl ?? '');
      setLanguages(existing.languages);
      setRoles(existing.roles);
      setTeamMemberId(existing.teamMemberId ?? '');
      setIsActive(existing.isActive);
    }
  }, [existing]);

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const handleSave = async () => {
    if (!email || !fullName) return;
    if (!isEdit && !password) return;

    try {
      if (isEdit && id) {
        await updateUser.mutateAsync({
          id,
          dto: { email, fullName, phone: phone || undefined, photoUrl: photoUrl || undefined, languages, roles, teamMemberId: teamMemberId || undefined, isActive },
        });
        toast.success(t('admin.users.toast.updated'));
        navigate('/admin/users');
      } else {
        await createUser.mutateAsync({
          email, fullName, phone: phone || undefined, photoUrl: photoUrl || undefined, languages, roles, teamMemberId: teamMemberId || undefined, password,
        });
        toast.success(t('admin.users.toast.created'));
        navigate('/admin/users');
      }
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 409) {
        toast.error(t('admin.users.toast.emailExists'));
      } else {
        toast.error(t('admin.users.toast.saveFailed'));
      }
    }
  };

  const isSaving = createUser.isPending || updateUser.isPending;
  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  if (isEdit && loadingUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(43_50%_54%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')} className="text-[hsl(0_0%_50%)]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{isEdit ? t('admin.users.editTitle') : t('admin.users.newTitle')}</h1>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.users.fields.email')}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.users.fields.fullName')}</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.users.fields.phone')}</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.users.fields.photoUrl')}</Label>
              <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label className={labelClass}>{t('admin.users.fields.languages')}</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_VALUES.map(lang => (
                <Badge
                  key={lang}
                  variant="outline"
                  className={`cursor-pointer text-xs ${languages.includes(lang)
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-[hsl(0_0%_96%)] text-[hsl(0_0%_50%)] border-[hsl(0_0%_85%)]'
                  }`}
                  onClick={() => toggleItem(languages, lang, setLanguages)}
                >
                  {lang}
                  {languages.includes(lang) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label className={labelClass}>{t('admin.users.fields.roles')}</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_VALUES.map(role => (
                <Badge
                  key={role}
                  variant="outline"
                  className={`cursor-pointer text-xs ${roles.includes(role)
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-[hsl(0_0%_96%)] text-[hsl(0_0%_50%)] border-[hsl(0_0%_85%)]'
                  }`}
                  onClick={() => toggleItem(roles, role, setRoles)}
                >
                  {role}
                  {roles.includes(role) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label className={labelClass}>{t('admin.users.fields.teamMember')}</Label>
            <Select value={teamMemberId} onValueChange={setTeamMemberId}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {(teamData ?? []).map(member => (
                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active toggle */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className={labelClass}>{t('admin.users.fields.active')}</Label>
            </div>
          )}

          {/* Password (create only) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.users.fields.password')}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !email || !fullName || (!isEdit && !password)}
          className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]"
        >
          {t('admin.users.saveUser')}
        </Button>
      </div>
    </div>
  );
}
