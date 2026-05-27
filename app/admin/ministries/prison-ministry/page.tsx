'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  MinistryInfoManager,
  MinistryItemsManager,
  type MinistryInfo,
  type MinistryItem,
} from '@/components/admin/MinistryContentManagers';

type Tab = 'info' | 'field' | 'outreaches';

const prisonFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Prison Ministry',
  motto: 'Sharing hope and restoration with those behind bars.',
  about:
    "The Prison Ministry is driven by the compassion of Christ for the forgotten and the marginalized. We believe that no life is beyond the reach of God's grace and that true restoration is possible for everyone.\n\nOur volunteers visit correctional facilities to provide spiritual guidance, counseling, and practical support. We are committed to walking with individuals during their incarceration and assisting them as they transition back into their families and communities.",
  heroImageUrl: '/hero/prison-ministry-1.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: null,
  partnershipTitle: null,
  partnershipBody: null,
  partnershipDetails: null,
  partnershipImageUrl: null,
  phone: null,
  email: null,
  location: null,
  contactIntro: null,
};

const fieldPictures: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Field Picture 1', description: 'Ministry in the field', imageUrl: '/hero/prison-ministry-1.jpg' },
  { title: 'Field Picture 2', description: 'Ministry in the field', imageUrl: '/moments/pm-1.jpg' },
  { title: 'Field Picture 3', description: 'Ministry in the field', imageUrl: '/moments/pm-2.jpg' },
  { title: 'Field Picture 4', description: 'Ministry in the field', imageUrl: '/moments/pm-3.jpg' },
  { title: 'Field Picture 5', description: 'Ministry in the field', imageUrl: '/moments/pm-4.jpg' },
  { title: 'Field Picture 6', description: 'Ministry in the field', imageUrl: '/moments/pm-5.jpg' },
];

const pastOutreaches: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Christmas Hope Visit',
    label: 'December 24, 2025',
    description: 'A special outreach event providing holiday meals, hygiene kits, and a message of redemption to inmates.',
    imageUrl: '/hero/hero-1.jpg',
  },
  {
    title: 'Restoration Workshop',
    label: 'March 15, 2026',
    description: 'A faith-based vocational training session designed to prepare individuals for successful reintegration into society.',
    imageUrl: '/hero/hero-2.jpg',
  },
  {
    title: 'Families of the Incarcerated Support',
    label: 'May 20, 2025',
    description: 'A community gathering focused on providing emotional and spiritual support to the families of those currently serving time.',
    imageUrl: '/hero/hero-3.jpg',
  },
];

export default function PrisonMinistryAdminPage() {
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
  const [activeTab, setActiveTab] = useState<Tab>('info');

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
    { id: 'info', label: 'Page Info' },
    { id: 'field', label: 'Ministry in the Field' },
    { id: 'outreaches', label: 'Past Outreaches' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Prison Ministry Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage Prison Ministry page content, logo, hero picture, field pictures, and past outreaches.
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
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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

      {activeTab === 'info' && (
        <MinistryInfoManager
          token={token}
          ministryKey="prison-ministry"
          ministryName="Prison Ministry"
          fallbackInfo={prisonFallbackInfo}
          visibleFields={['name', 'motto', 'about', 'logoImageUrl', 'heroImageUrl']}
          fieldLabels={{ about: 'Mandate', logoImageUrl: 'Logo', heroImageUrl: 'Hero Picture' }}
          showExtraSaveButtons={false}
        />
      )}

      {activeTab === 'field' && (
        <MinistryItemsManager
          token={token}
          ministryKey="prison-ministry"
          category="field-picture"
          title="Ministry in the Field Pictures"
          description="Manage the pictures shown in the Ministry in the Field section."
          fallbackItems={fieldPictures}
          labels={{ title: 'Picture Title', description: 'Caption', image: 'Field Picture', save: 'Save', formTitle: 'Save Field Picture' }}
          showLabel={false}
          showSortOrder={false}
        />
      )}

      {activeTab === 'outreaches' && (
        <MinistryItemsManager
          token={token}
          ministryKey="prison-ministry"
          category="outreach"
          title="Past Outreaches"
          description="Manage outreach stories shown in the carousel."
          fallbackItems={pastOutreaches}
          labels={{ title: 'Outreach Title', description: 'Description', label: 'Date', image: 'Outreach Picture', save: 'Save Outreach' }}
        />
      )}
    </div>
  );
}
