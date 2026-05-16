'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SchoolIntakesManager from '@/components/admin/SchoolIntakesManager';
import SchoolInfoManager from '@/components/admin/SchoolInfoManager';
import SchoolNewsManager from '@/components/admin/SchoolNewsManager';
import SchoolEventsManager from '@/components/admin/SchoolEventsManager';
import SchoolKeyDatesManager from '@/components/admin/SchoolKeyDatesManager';
import { HOPE_SCHOOL_NEWS } from '@/components/schools/schoolNewsFallbacks';

type Tab = 'enrollment' | 'key-dates' | 'info' | 'news' | 'events';

const hopeSchoolFallbackInfo = {
  header: 'Hope School of Ministry',
  motto: 'Raising a New Generation of Leaders with Global Influence',
  about: `Hope School exists to equip believers with leadership training, practical ministry skills, and a heart for mission.

To provide general leadership training in preparing future leaders for life, citizenship, and active Christian service.
To provide training and practical experience for believers who desire to be equipped for effective service to Christ and in their local churches.
To provide relevant instruction to believers in their fields of ministry that will enable them to gain skills and abilities necessary for effective ministry.
To foster missionary interests and concern.`,
  mission:
    'To provide leadership training and practical ministry equipping for believers who desire to serve Christ effectively in their local churches and communities.',
  vision:
    'To raise future leaders prepared for life, citizenship, and active Christian service, carrying vision, character, and missionary concern.',
  heroImageUrl: '/schools/hope-school/hosom.jpeg',
  logoImageUrl: '/schools/hope-school/logo.png',
  missionImageUrl: '/schools/hope-school/modules.jpeg',
  phone: '+265 999 045 869 / +265 992 603 608',
  email: 'info@piccworldwide.org / hopeschool@piccworldwide.org',
  address:
    'Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi',
};

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
    { id: 'key-dates', label: 'Key Dates' },
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
        {activeTab === 'key-dates' && <SchoolKeyDatesManager token={token} schoolKey="hope-school" />}
        {activeTab === 'info' && (
          <SchoolInfoManager
            token={token}
            schoolKey="hope-school"
            schoolName="Hope School"
            fallbackInfo={hopeSchoolFallbackInfo}
            config={{
              hiddenFields: ['coreValuesImageUrl'],
              labels: {
                heroImageUrl: 'Hero Background Image',
                logoImageUrl: 'School Logo Image',
                missionImageUrl: 'Modules Background Image',
              },
              editorDescription:
                'Update the Hope School page content and the images used on the public page.',
            }}
          />
        )}
        {activeTab === 'news' && (
          <SchoolNewsManager
            token={token}
            schoolKey="hope-school"
            schoolName="Hope School"
            fallbackNews={HOPE_SCHOOL_NEWS.map((item) => ({
              badge: item.badge,
              date: item.date,
              title: item.title,
              content: item.description,
              imageUrl: item.image,
            }))}
          />
        )}
        {activeTab === 'events' && <SchoolEventsManager token={token} schoolKey="hope-school" schoolName="Hope School" />}
      </div>
    </div>
  );
}
