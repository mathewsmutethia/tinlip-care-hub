import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { clientProfile, documents, vehicles } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, Bell, Lock, ScrollText, HelpCircle, LogOut, ChevronRight, ExternalLink, Mail, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileScreen() {
  const { logout, user, profile, refreshProfile } = useApp();
  const { toast } = useToast();

  const [openSheet, setOpenSheet] = useState<'documents' | 'notifications' | 'password' | 'terms' | 'help' | null>(null);
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    status_updates: true,
    payment_reminders: true,
    promotional: false,
  });
  const [passwordCooldown, setPasswordCooldown] = useState(false);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const email = profile?.email || user?.email || '';
  const phone = profile?.phone || '';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '';

  useEffect(() => {
    if (profile?.notification_preferences) {
      setNotifPrefs(profile.notification_preferences);
    }
  }, [profile]);

  const openDocuments = async () => {
    setOpenSheet('documents');
    setLoadingDocs(true);
    try {
      const { data: vList } = await vehicles.list();
      setVehicleList(vList ?? []);

      const urls: Record<string, string> = {};
      if (profile?.id_document_url) {
        urls['id'] = await documents.getSignedUrl(profile.id_document_url);
      }
      for (const v of (vList ?? [])) {
        if (v.logbook_url) urls[`${v.id}_logbook`] = await documents.getSignedUrl(v.logbook_url);
        if (v.insurance_url) urls[`${v.id}_insurance`] = await documents.getSignedUrl(v.insurance_url);
      }
      setDocUrls(urls);
    } catch {
      toast({ title: 'Could not load documents', variant: 'destructive' });
    }
    setLoadingDocs(false);
  };

  const handleNotifToggle = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await clientProfile.updateNotifications(updated);
      await refreshProfile();
    } catch {
      setNotifPrefs(notifPrefs);
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordCooldown || !email) return;
    setPasswordCooldown(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      toast({ title: 'Password reset email sent', description: `Check your inbox at ${email}` });
    } catch {
      toast({ title: 'Failed to send reset email', variant: 'destructive' });
    }
    setTimeout(() => setPasswordCooldown(false), 60000);
  };

  const menuItems = [
    { icon: FileText, label: 'My Documents', action: openDocuments },
    { icon: Bell, label: 'Notification Preferences', action: () => setOpenSheet('notifications') },
    { icon: Lock, label: 'Change Password', action: handleChangePassword },
    { icon: ScrollText, label: 'Terms & Privacy Policy', action: () => setOpenSheet('terms') },
    { icon: HelpCircle, label: 'Help & Support', action: () => setOpenSheet('help') },
  ];

  return (
    <>
      <div className="pb-20 md:pb-4 animate-fade-in">
        <div className="px-4 pt-6 pb-4 md:px-0">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="px-4 space-y-4 md:px-0">
          <div className="bg-card border rounded-xl p-5 card-shadow flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl font-heading">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
              {memberSince && <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>}
            </div>
          </div>

          <div className="bg-card border rounded-xl card-shadow overflow-hidden">
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.label === 'Change Password' && passwordCooldown}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary transition-colors disabled:opacity-50 ${i < menuItems.length - 1 ? 'border-b' : ''}`}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {item.label === 'Change Password' && passwordCooldown ? 'Reset email sent — check inbox' : item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 text-destructive font-medium text-sm hover:bg-destructive/5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* My Documents */}
      <Sheet open={openSheet === 'documents'} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>My Documents</SheetTitle>
          </SheetHeader>
          {loadingDocs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identity</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-foreground">ID Document</span>
                  {docUrls['id'] ? (
                    <a href={docUrls['id']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary text-xs font-medium">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not uploaded</span>
                  )}
                </div>
              </div>
              {vehicleList.map((v) => (
                <div key={v.id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{v.registration} — {v.make} {v.model}</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Logbook', key: `${v.id}_logbook` },
                      { label: 'Insurance', key: `${v.id}_insurance` },
                    ].map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <span className="text-sm text-foreground">{doc.label}</span>
                        {docUrls[doc.key] ? (
                          <a href={docUrls[doc.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary text-xs font-medium">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not uploaded</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Notification Preferences */}
      <Sheet open={openSheet === 'notifications'} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Notification Preferences</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            {([
              { key: 'status_updates' as const, label: 'Incident status updates', description: 'Get notified when your incident status changes' },
              { key: 'payment_reminders' as const, label: 'Payment reminders', description: 'Renewal reminders before your coverage expires' },
              { key: 'promotional' as const, label: 'Promotions & news', description: 'Occasional updates about Tinlip offers' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={notifPrefs[item.key]}
                  onCheckedChange={() => handleNotifToggle(item.key)}
                />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Terms & Privacy Policy */}
      <Sheet open={openSheet === 'terms'} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Terms & Privacy Policy</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Service Agreement</h3>
              <p>This agreement is between Tinlip Autocare Limited ("Provider") and you ("Client"). By using this platform you accept these terms.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Coverage</h3>
              <p>Coverage includes roadside assistance, towing, mechanical diagnosis, regular servicing, and spares requests. Coverage is only valid after premium payment and admin approval.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Client Obligations</h3>
              <p>You must provide accurate and complete information. Vehicles must have valid insurance. Incidents must be reported promptly via this portal.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Payment</h3>
              <p>Annual premium is paid via M-Pesa. Coverage activates only on successful payment confirmation. No partial payments.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Privacy</h3>
              <p>Your personal data and vehicle information is stored securely and used solely for service delivery. We do not sell your data to third parties.</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">For the full legal agreement visit <span className="text-primary">www.tinlipautocare.co.ke</span></p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Help & Support */}
      <Sheet open={openSheet === 'help'} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Help & Support</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">Need help? Reach our support team through any of the channels below.</p>
            <a
              href="mailto:support@tinlipautocare.co.ke"
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">support@tinlipautocare.co.ke</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
            </a>
            <a
              href="tel:+254700000000"
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone Support</p>
                <p className="text-xs text-muted-foreground">+254 700 000 000</p>
              </div>
            </a>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">Support hours: Mon–Fri, 8am–6pm EAT</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
