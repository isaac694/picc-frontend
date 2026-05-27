'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SchoolIntakesManager from '@/components/admin/SchoolIntakesManager';
import SchoolInfoManager from '@/components/admin/SchoolInfoManager';
import SchoolKeyDatesManager from '@/components/admin/SchoolKeyDatesManager';

type Tab = 'enrollment' | 'key-dates' | 'info';

const piccSecondaryFallbackInfo = {
  header: 'PICC Secondary School',
  motto: 'Equipping Children Today To Become Godly Leaders Tomorrow',
  about:
    'PICC Secondary School is a fast growing private secondary institution established in 2024 with a vision of transforming students that will bring hope to the society through Christ centered education in partnership with parents and community. The school began its academic journey by enrolling its first cohort of Form one students, laying a strong foundation built on academic excellence, discipline and innovation.',
  mission:
    'Equipping children today to become Godly leaders tomorrow by providing rigorous academics, Bible based education, discipline unto discipleship and missions mindedness that inspire the next generation.',
  vision:
    'Our vision is transformed students that bring hope to the society through Christ centered education in partnership with parents and community.',
  heroImageUrl: '/schools/picc-secondary/campus.jpg',
  logoImageUrl: '/schools/picc-secondary/logo.jpg',
  missionImageUrl: '/schools/picc-secondary/our-mission.jpg',
  coreValuesImageUrl: '/schools/picc-secondary/core-values.png',
  phone: '+265 994 798 236 / +265 998 473 289',
  email: 'info@piccschoolsmw.org',
  address:
    'Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi',
  coreValues: [
    { name: 'Absolute dependence on God' },
    { name: 'Discipline' },
    { name: 'Integrity' },
    { name: 'Excellence' },
    { name: 'Diligence' },
    { name: 'Involvement' },
    { name: 'Focus' },
    { name: 'Mentorship' },
    { name: 'Impactfulness' },
  ],
};

export default function PICCSecondaryEnrollmentAdminPage() {
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
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">PICC Secondary Admin</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Manage enrollment and school information.
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
        {activeTab === 'enrollment' && <SchoolIntakesManager token={token} schoolKey="picc-secondary" />}
        {activeTab === 'key-dates' && <SchoolKeyDatesManager token={token} schoolKey="picc-secondary" />}
        {activeTab === 'info' && (
          <SchoolInfoManager
            token={token}
            schoolKey="picc-secondary"
            schoolName="PICC Secondary"
            fallbackInfo={piccSecondaryFallbackInfo}
            config={{
              useFallbackWhenRecordExists: false,
              labels: {
                heroImageUrl: 'Hero Background Image',
                logoImageUrl: 'School Logo Image',
                missionImageUrl: 'Mission Section Background',
                coreValuesImageUrl: 'Core Values Background',
              },
              editorDescription:
                'Update the PICC Secondary page content, core values, and the image URLs used across the public page.',
              collectionEditors: {
                coreValues: {
                  label: 'Core Values',
                  description: 'Manage the core values shown on the public PICC Secondary page.',
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
