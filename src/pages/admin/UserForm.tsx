import { useState, useEffect, useRef, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUser, useCreateUser, useUpdateUser } from '@/hooks/api/useAdminUsers';
import { useAdminTeam, useUploadFile } from '@/hooks/api/useAdmin';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

const ROLE_VALUES = ['Admin', 'Agent', 'Editor', 'Marketing'] as const;
const LANGUAGE_VALUES = ['ET', 'EN', 'RU'] as const;

export default function UserForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fieldId = useId();

  const { data: existing, isLoading: loadingUser } = useAdminUser(isEdit ? id : undefined);
  const { data: teamData } = useAdminTeam();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const uploadFile = useUploadFile();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [teamMemberId, setTeamMemberId] = useState('none');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Refs used to focus/scroll to the first missing required field when the
  // user presses Save with the form incomplete (Save is always clickable now).
  const photoInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing) {
      setEmail(existing.email);
      setFullName(existing.fullName);
      setPhone(existing.phone ?? '');
      setPhotoUrl(existing.photoUrl ?? '');
      setLanguages(existing.languages);
      setRoles(existing.roles);
      setTeamMemberId(existing.teamMemberId ?? 'none');
      setIsActive(existing.isActive);
    }
  }, [existing]);

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadFile.mutateAsync({ file, folder: 'users' });
      setPhotoUrl(result.url);
    } catch {
      toast.error(t('admin.users.fields.uploadFailed', 'Photo upload failed. Please try again.'));
    } finally {
      setUploadingPhoto(false);
      // Reset so re-selecting the same file fires the change event again.
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    // Save is always clickable: instead of a silently-disabled button, show a
    // clear toast and jump to the first missing required field so a
    // non-technical user understands what to fill in.
    const firstInvalid = !email.trim()
      ? emailRef
      : !fullName.trim()
        ? fullNameRef
        : (!isEdit && !password)
          ? passwordRef
          : null;

    if (firstInvalid) {
      toast.error(t('admin.users.validation.required', 'Please fill in all required fields marked with *.'));
      firstInvalid.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.current?.focus();
      return;
    }

    // The "—" option uses the sentinel value 'none' (Radix Select can't use an
    // empty-string value). Normalize it (and any empty value) to undefined so
    // the API correctly links / unlinks the user to a team member.
    const normalizedTeamMemberId = teamMemberId && teamMemberId !== 'none' ? teamMemberId : undefined;

    try {
      if (isEdit && id) {
        await updateUser.mutateAsync({
          id,
          dto: { email, fullName, phone: phone || undefined, photoUrl: photoUrl || undefined, languages, roles, teamMemberId: normalizedTeamMemberId, isActive },
        });
        toast.success(t('admin.users.toast.updated'));
        navigate('/admin/users');
      } else {
        await createUser.mutateAsync({
          email, fullName, phone: phone || undefined, photoUrl: photoUrl || undefined, languages, roles, teamMemberId: normalizedTeamMemberId, password,
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
  const inputClass = "h-11 border-border bg-card text-foreground focus:border-primary focus:ring-primary";
  const labelClass = "text-sm text-muted-foreground font-medium";

  // Visual-only asterisk for required fields. aria-hidden so screen readers
  // rely on the input's own `required` attribute instead of reading the "*".
  const RequiredMark = () => <span aria-hidden="true" className="text-destructive ml-0.5">*</span>;

  if (isEdit && loadingUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')} className="text-muted-foreground" aria-label={t('admin.common.back')} title={t('admin.common.back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{isEdit ? t('admin.users.editTitle') : t('admin.users.newTitle')}</h1>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-email`} className={labelClass}>{t('admin.users.fields.email')}{!isEdit && <RequiredMark />}</Label>
              <Input id={`${fieldId}-email`} ref={emailRef} type="email" autoComplete="email" required={!isEdit} aria-required={!isEdit} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-fullName`} className={labelClass}>{t('admin.users.fields.fullName')}<RequiredMark /></Label>
              <Input id={`${fieldId}-fullName`} ref={fullNameRef} autoComplete="name" required aria-required value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-phone`} className={labelClass}>{t('admin.users.fields.phone')}</Label>
              <Input id={`${fieldId}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Photo — upload with preview (replaces the old raw URL text input) */}
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-photo`} className={labelClass}>{t('admin.users.fields.photo', 'Photo')}</Label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full border border-dashed border-border bg-muted flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="border-border text-muted-foreground"
                >
                  {uploadingPhoto && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                  {photoUrl
                    ? t('admin.users.fields.changePhoto', 'Change photo')
                    : t('admin.users.fields.uploadPhoto', 'Upload photo')}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhotoUrl('')}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    {t('admin.users.fields.removePhoto', 'Remove')}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin.users.fields.photoHint', 'Upload a profile picture (JPG or PNG). It appears next to this user across the admin.')}
            </p>
            <input id={`${fieldId}-photo`} ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
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
                    : 'bg-muted text-muted-foreground border-border'
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
                    : 'bg-muted text-muted-foreground border-border'
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
            <Label htmlFor={`${fieldId}-teamMember`} className={labelClass}>{t('admin.users.fields.teamMember')}</Label>
            <Select value={teamMemberId} onValueChange={setTeamMemberId}>
              <SelectTrigger id={`${fieldId}-teamMember`} className={inputClass}>
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
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label={t('admin.users.fields.active')} />
              <Label className={labelClass}>{t('admin.users.fields.active')}</Label>
            </div>
          )}

          {/* Password (create only) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-password`} className={labelClass}>{t('admin.users.fields.password')}<RequiredMark /></Label>
              <Input id={`${fieldId}-password`} ref={passwordRef} type="password" required aria-required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || uploadingPhoto}
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('admin.users.saveUser')}
        </Button>
      </div>
    </div>
  );
}
