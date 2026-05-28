'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AriaNavButton, AriaSwitch } from '@/components/ui/aria-tab-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEngineerSettings,
  useActiveSessions,
  useUpdateSettings,
  useRevokeSession,
  useMyEngineerProfile,
  useUpdateEngineerProfile,
} from '@/lib/api-hooks';
import { apiFetch } from '@/lib/api-fetch';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  buildProfilePatchPayload,
  validateProfileFormName,
  type EngineerProfileForm,
} from '@/lib/engineer-profile-form';
import type { NotificationPreferences, PrivacySettings } from '@/lib/payments-analytics-data';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'privacy' | 'billing' | 'danger';

export default function EngineerSettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-8">
          {/* Left Nav */}
          <aside className="w-56 shrink-0">
            <nav className="sticky top-8 space-y-1" aria-label="Settings navigation">
              {([
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'account', label: 'Account', icon: '🔐' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                { id: 'privacy', label: 'Privacy', icon: '🛡️' },
                { id: 'billing', label: 'Billing', icon: '💳' },
                { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
              ] as const).map((tab) => (
                <AriaNavButton
                  key={tab.id}
                  current={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    activeTab === tab.id
                      ? 'bg-accent-cyan text-bg-base'
                      : 'text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </AriaNavButton>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'danger' && <DangerZoneTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────
function ProfileTab() {
  const { data: profile, isLoading } = useMyEngineerProfile();
  const updateProfile = useUpdateEngineerProfile();
  const [form, setForm] = React.useState<Pick<EngineerProfileForm, 'fullName' | 'headline' | 'bio'>>({
    fullName: '',
    headline: '',
    bio: '',
  });
  const [saved, setSaved] = React.useState({ fullName: '', headline: '', bio: '' });

  React.useEffect(() => {
    const fullName = profile?.fullName || '';
    const headline = profile?.headline || '';
    const bio = profile?.bio || '';
    setForm((prev) =>
      prev.fullName === fullName && prev.headline === headline && prev.bio === bio
        ? prev
        : { fullName, headline, bio }
    );
    setSaved((prev) =>
      prev.fullName === fullName && prev.headline === headline && prev.bio === bio
        ? prev
        : { fullName, headline, bio }
    );
  }, [profile?.fullName, profile?.headline, profile?.bio]);

  const isDirty =
    form.fullName !== saved.fullName ||
    form.headline !== saved.headline ||
    form.bio !== saved.bio;

  async function handleSave() {
    const nameError = validateProfileFormName(form.fullName);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    const payload = buildProfilePatchPayload({
      ...form,
      location: profile?.location || '',
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      portfolioUrl: profile?.portfolioUrl || '',
      hourlyRate: Number(profile?.hourlyRate) || 0,
      availabilityStatus:
        (profile?.availabilityStatus as EngineerProfileForm['availabilityStatus']) ||
        'available_now',
    });

    try {
      const updated = await updateProfile.mutateAsync(payload);
      const mapped = {
        fullName: updated.fullName || '',
        headline: updated.headline || '',
        bio: updated.bio || '',
      };
      setForm(mapped);
      setSaved(mapped);
      toast.success('Profile saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    }
  }

  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="font-display font-semibold text-text-primary text-xl mb-1">Profile Settings</h2>
        <p className="text-text-muted text-sm">Update your public profile information</p>
      </div>

      <Input
        label="Full Name"
        value={form.fullName}
        onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
      />
      <Input
        label="Headline"
        value={form.headline}
        onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
        hint="e.g. LLM Engineer · RAG Systems"
      />

      <div>
        <label htmlFor="settings-bio" className="block text-sm font-medium text-text-secondary mb-2">
          Bio
        </label>
        <textarea
          id="settings-bio"
          value={form.bio}
          onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="md"
          disabled={!isDirty}
          loading={updateProfile.isPending}
          onClick={handleSave}
          data-testid="save-profile-btn"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────
function AccountTab() {
  const { data: sessions, isLoading: sessionsLoading } = useActiveSessions();
  const revokeSession = useRevokeSession();
  const { user } = useUser();
  const [showChangeEmail, setShowChangeEmail] = React.useState(false);
  // Optimistic: track locally revoked session IDs
  const [revokedIds, setRevokedIds] = React.useState<string[]>([]);

  function handleRevokeSession(sessionId: string) {
    setRevokedIds(prev => [...prev, sessionId]);
    revokeSession.mutate(sessionId);
  }

  const visibleSessions = (sessions ?? []).filter(s => !revokedIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Email Address</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary">{user?.primaryEmailAddress?.emailAddress || '—'}</p>
            <p className="text-xs text-accent-green mt-1">✓ Verified</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowChangeEmail(true)}>
            Change Email
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Password</h2>
        <Button size="sm" variant="secondary">
          Change Password
        </Button>
      </div>

      {/* Connected Accounts */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Connected Accounts</h2>
        <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold">G</span>
            </div>
            <div>
              <p className="text-sm text-text-primary">Google</p>
              <p className="text-xs text-accent-green">Connected</p>
            </div>
          </div>
          <Button size="sm" variant="ghost">
            Disconnect
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Active Sessions</h2>
        <div className="space-y-3">
          {sessionsLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 bg-bg-elevated rounded-xl space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))
          ) : !visibleSessions || visibleSessions.length === 0 ? (
            <p className="text-text-muted text-sm">No active sessions found</p>
          ) : (
            visibleSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between p-3 bg-bg-elevated rounded-xl"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-text-primary font-medium">{session.device}</p>
                  {session.isCurrent && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.1)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{session.browser} · {session.location}</p>
                <p className="text-xs text-text-muted mt-1">Last active: {session.lastActive}</p>
              </div>
              {!session.isCurrent && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={revokeSession.isPending}
                  onClick={() => handleRevokeSession(session.id)}
                  data-testid={`revoke-session-${session.id}`}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────
function NotificationsTab() {
  const { data: settings, isLoading } = useEngineerSettings();
  const updateSettings = useUpdateSettings();
  // Initialize once from API data — use ref to avoid re-init on re-render
  const initialized = React.useRef(false);
  const [prefs, setPrefs] = React.useState<NotificationPreferences | null>(null);

  React.useEffect(() => {
    if (!initialized.current && settings?.notifications) {
      initialized.current = true;
      setPrefs(settings.notifications);
    }
  }, [settings?.notifications?.email, settings?.notifications?.push]); // eslint-disable-line

  function togglePref(channel: 'email' | 'push', key: keyof NotificationPreferences['email']) {
    if (!prefs) return;
    const updated = {
      ...prefs,
      [channel]: { ...prefs[channel], [key]: !prefs[channel][key] },
    };
    setPrefs(updated);
    updateSettings.mutate({ notifications: updated });
  }

  if (isLoading || !prefs) {
    return (
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="font-display font-semibold text-text-primary text-xl mb-1">Notifications</h2>
        <p className="text-text-muted text-sm">Manage how you receive notifications</p>
      </div>

      {/* Email Notifications */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Email Notifications</h3>
        <div className="space-y-3">
          {Object.entries(prefs.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
              <label htmlFor={`email-${key}`} className="text-sm text-text-primary cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </label>
              <ToggleSwitch
                id={`email-${key}`}
                checked={value}
                onChange={() => togglePref('email', key as keyof NotificationPreferences['email'])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Push Notifications (PWA)</h3>
        <div className="space-y-3">
          {Object.entries(prefs.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
              <label htmlFor={`push-${key}`} className="text-sm text-text-primary cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </label>
              <ToggleSwitch
                id={`push-${key}`}
                checked={value}
                onChange={() => togglePref('push', key as keyof NotificationPreferences['push'])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Tab ──────────────────────────────────────────────
function PrivacyTab() {
  const { data: settings, isLoading } = useEngineerSettings();
  const updateSettings = useUpdateSettings();
  const privacyInitialized = React.useRef(false);
  const [privacySettings, setPrivacySettings] = React.useState<PrivacySettings | null>(null);
  const [showDataExport, setShowDataExport] = React.useState(false);

  React.useEffect(() => {
    if (!privacyInitialized.current && settings?.privacy) {
      privacyInitialized.current = true;
      setPrivacySettings(settings.privacy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.privacy?.marketingEmails, settings?.privacy?.aiRecommendations, settings?.privacy?.publicActivityFeed]);

  function toggleSetting(key: keyof PrivacySettings) {
    if (!privacySettings) return;
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    updateSettings.mutate({ privacy: updated });
  }

  async function handleDataExport() {
    setShowDataExport(true);
    try {
      await apiFetch('/api/engineer/settings/data-export', { method: 'POST' });
      toast.success('Data export request submitted. We will notify you shortly.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request data export');
    } finally {
      setShowDataExport(false);
    }
  }

  if (isLoading || !privacySettings) {
    return (
      <div className="space-y-6">
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consent Toggles */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Privacy Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
            <div className="flex-1">
              <label htmlFor="marketing" className="text-sm text-text-primary cursor-pointer block">
                Marketing Emails
              </label>
              <p className="text-xs text-text-muted mt-1">Receive updates about new features and offers</p>
            </div>
            <ToggleSwitch
              id="marketing"
              checked={privacySettings.marketingEmails}
              onChange={() => toggleSetting('marketingEmails')}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
            <div className="flex-1">
              <label htmlFor="ai" className="text-sm text-text-primary cursor-pointer block">
                AI Recommendations
              </label>
              <p className="text-xs text-text-muted mt-1">Use profile data for personalized job matches</p>
            </div>
            <ToggleSwitch
              id="ai"
              checked={privacySettings.aiRecommendations}
              onChange={() => toggleSetting('aiRecommendations')}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
            <div className="flex-1">
              <label htmlFor="activity" className="text-sm text-text-primary cursor-pointer block">
                Public Activity Feed
              </label>
              <p className="text-xs text-text-muted mt-1">Show your activity on your public profile</p>
            </div>
            <ToggleSwitch
              id="activity"
              checked={privacySettings.publicActivityFeed}
              onChange={() => toggleSetting('publicActivityFeed')}
            />
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary text-lg mb-2">Download Your Data</h2>
        <p className="text-text-muted text-sm mb-4">
          Request a copy of all your data. We&apos;ll email you when it&apos;s ready.
        </p>
        <Button size="md" variant="secondary" loading={showDataExport} onClick={handleDataExport}>
          Request Data Export
        </Button>
      </div>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────
function BillingTab() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
      <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Billing</h2>
      <p className="text-text-muted text-sm">
        Engineers don&apos;t have subscription plans. Visit your{' '}
        <a href="/engineer/wallet" className="text-accent-cyan hover:underline">
          Wallet
        </a>{' '}
        to manage payments.
      </p>
    </div>
  );
}

// ─── Danger Zone Tab ──────────────────────────────────────────
function DangerZoneTab() {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  return (
    <>
      <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6">
        <h2 className="font-display font-semibold text-accent-red text-lg mb-2">Danger Zone</h2>
        <p className="text-text-muted text-sm mb-6">
          Irreversible actions. Please proceed with caution.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-surface rounded-xl border border-[rgba(239,68,68,0.2)]">
            <div>
              <p className="text-sm font-medium text-text-primary">Delete Your Account</p>
              <p className="text-xs text-text-muted mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} data-testid="open-delete-modal-btn">
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <DeleteAccountModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </>
  );
}

// ─── Toggle Switch Component ──────────────────────────────────
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ id, checked, onChange }: ToggleSwitchProps) {
  return (
    <AriaSwitch
      id={id}
      checked={checked}
      onClick={onChange}
      className={cn(
        'relative w-11 h-6 rounded-full transition-all duration-200',
        checked ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      />
    </AriaSwitch>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────
interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [emailInput, setEmailInput] = React.useState('');
  const [understood, setUnderstood] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const { user } = useUser();

  const correctEmail = user?.primaryEmailAddress?.emailAddress || '';
  const emailMatches = emailInput === correctEmail;

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch('/api/engineer/settings/account-deletion', {
        method: 'POST',
        body: JSON.stringify({ reason: 'user_requested' }),
      });
      toast.success('Account deletion requested. Your account is scheduled for deletion in 30 days.');
      window.location.href = '/?deleted=true';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request account deletion');
      setDeleting(false);
    }
  }

  function handleClose() {
    setStep(1);
    setEmailInput('');
    setUnderstood(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Delete Account" size="md">
      <div className="p-6 space-y-5">
        {step === 1 && (
          <>
            <div className="p-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl">
              <p className="text-sm text-accent-red font-semibold mb-2">⚠️ This action cannot be undone</p>
              <p className="text-xs text-text-secondary">
                Your account will be permanently deleted. All your data will be anonymized and cannot be recovered.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Type your email to confirm: <strong>{correctEmail}</strong>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(239,68,68,0.3)]"
                data-testid="delete-email-input"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                disabled={!emailMatches}
                onClick={() => setStep(2)}
                data-testid="delete-step1-btn"
              >
                Continue
              </Button>
              <Button variant="ghost" size="lg" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="text-sm text-text-primary mb-4">Please confirm you understand:</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-text-secondary">
                  I understand that my account will be permanently deleted, all data will be anonymized, and this action cannot be reversed.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                disabled={!understood}
                onClick={() => setStep(3)}
              >
                I Understand, Continue
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-accent-red mb-2">Final Confirmation</p>
              <p className="text-sm text-text-secondary">
                Are you absolutely sure you want to delete your account?
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                loading={deleting}
                onClick={handleDelete}
                data-testid="final-delete-btn"
              >
                Yes, Delete My Account
              </Button>
              <Button variant="ghost" size="lg" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
