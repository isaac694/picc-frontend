'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SchoolIntakesManager from '@/components/admin/SchoolIntakesManager';
import SchoolInfoManager from '@/components/admin/SchoolInfoManager';
import SchoolNewsManager from '@/components/admin/SchoolNewsManager';
import SchoolEventsManager from '@/components/admin/SchoolEventsManager';

type Tab = 'enrollment' | 'info' | 'news' | 'events';

export default function HopeSchoolEnrollmentAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<Tab>('enrollment');

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'enrollment', label: 'Enrollment' },
    { id: 'info', label: 'School Info' },
    { id: 'news', label: 'News' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">Hope School Admin</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Manage enrollment, school information, news, and events.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <div className="border-b border-border/60">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/70 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'enrollment' && <SchoolIntakesManager token={token} schoolKey="hope-school" />}
        {activeTab === 'info' && <SchoolInfoManager token={token} schoolKey="hope-school" schoolName="Hope School" />}
        {activeTab === 'news' && <SchoolNewsManager token={token} schoolKey="hope-school" schoolName="Hope School" />}
        {activeTab === 'events' && <SchoolEventsManager token={token} schoolKey="hope-school" schoolName="Hope School" />}
      </div>
    </div>
  );
}

