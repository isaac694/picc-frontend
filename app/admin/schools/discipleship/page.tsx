'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SchoolIntakesManager from '@/components/admin/SchoolIntakesManager';
import SchoolRegistrationsManager from '@/components/admin/SchoolRegistrationsManager';
import SchoolMainEventsPanel from '@/components/admin/SchoolMainEventsPanel';
import NewsManager from '@/components/admin/NewsManager';
import SchoolInfoManager from '@/components/admin/SchoolInfoManager';
import SchoolKeyDatesManager from '@/components/admin/SchoolKeyDatesManager';

type Tab = 'registrations' | 'enrollment' | 'key-dates' | 'info' | 'news' | 'events';

const discipleshipFallbackInfo = {
  header: 'School of Discipleship',
  motto: 'Rooted in Christ, Growing in Truth, Impacting the World',
  about: null,
  mission:
    'To equip and nurture believers through sound biblical teaching, spiritual formation, and practical dscipleship, empowering them to become mature followers of Jesus Christ who live out the mandate of bringing hope to the hopeless and life to the dying.',
  vision:
    'To raise a generation of deeply rooted, spiritually grounded, and kingdom-minded disciples who reflect the character of Christ and effectively impact their communities and the world.',
  heroImageUrl: '/schools/discipleship/discipleship.jpeg',
  logoImageUrl: '/schools/discipleship/logo.png',
  missionImageUrl: '/schools/discipleship/lessons.jpeg',
  coreValuesImageUrl: '/schools/discipleship/contact.jpeg',
  phone: '+265 999 045 869 / +265 992 603 608',
  email: 'discipleship@piccworldwide.org',
  address:
    'Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi',
  lessons: [
    {
      num: '01',
      title: 'The Nature and Character of God',
      description: 'Exploring the attributes, holiness, and love of our Creator',
    },
    {
      num: '02',
      title: 'The Word of God',
      description: 'The authority, power, and practical application of the Holy Scriptures',
    },
    {
      num: '03',
      title: 'Understanding Faith',
      description: "Building a firm foundation of belief and trust in God's promises",
    },
    {
      num: '04',
      title: 'Understanding Prayer and Fasting',
      description: 'Deepening your spiritual intimacy and power through disciplined seeking',
    },
    {
      num: '05',
      title: 'Understanding Kingdom Giving',
      description: 'Principles of stewardship, generosity, and financial blessing',
    },
    {
      num: '06',
      title: 'Understanding Kingdom',
      description: "Living as citizens of God's realm and under His sovereign rule",
    },
    {
      num: '07',
      title: 'Dedication and Devotion to God',
      description: 'Consecrating your life and heart to the service of the Almighty',
    },
    {
      num: '08',
      title: "The Holy Spirit and His Ministry in the Believer's Life",
      description: "The role and empowerment of the Spirit in the believer's life",
    },
  ],
  coreValues: [
    {
      name: 'Christ-Centered Living',
      description: 'We uphold Jesus Christ as the foundation of our faith and the model for all discipleship.',
    },
    {
      name: 'Biblical Truth',
      description: 'We are committed to teaching and applying the Word of God as the ultimate authority for life and doctrine.',
    },
    {
      name: 'Spiritual Growth',
      description: 'We prioritize continuous growth in faith, character, and intimacy with God.',
    },
    {
      name: 'Prayer and Devotion',
      description: 'We cultivate a lifestyle of prayer, fasting, and total dependence on God.',
    },
    {
      name: 'Faith and Obedience',
      description: "We encourage believers to walk by faith and live in obedience to God's word.",
    },
    {
      name: 'Kingdom Stewardship',
      description: 'We promote faithful giving and responsible stewardship as an expression of worship.',
    },
    {
      name: 'Empowerment by the Holy Spirit',
      description: "We emphasize the role of the Holy Spirit in guiding, empowering, and transforming the believer's life.",
    },
    {
      name: 'Commitment to Discipleship',
      description: 'We are devoted to raising true disciples who disciple others.',
    },
  ],
};

export default function DiscipleshipEnrollmentAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<Tab>('registrations');

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
    { id: 'registrations', label: 'Registrations' },
    { id: 'enrollment', label: 'Intakes' },
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
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">Discipleship Admin</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Manage enrollment, school information, news, and events.
          </p>
        </div>
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
        {activeTab === 'registrations' && <SchoolRegistrationsManager token={token} schoolKey="discipleship" schoolName="Discipleship Class" />}
        {activeTab === 'enrollment' && <SchoolIntakesManager token={token} schoolKey="discipleship" />}
        {activeTab === 'key-dates' && <SchoolKeyDatesManager token={token} schoolKey="discipleship" />}
        {activeTab === 'info' && (
          <SchoolInfoManager
            token={token}
            schoolKey="discipleship"
            schoolName="Discipleship"
            fallbackInfo={discipleshipFallbackInfo}
            config={{
              hiddenFields: ['about'],
              labels: {
                header: 'School Title',
                motto: 'Motto',
                mission: 'Mission Statement',
                vision: 'Vision Statement',
                heroImageUrl: 'Hero Background Image',
                logoImageUrl: 'School Logo Image',
                missionImageUrl: 'Lessons Background Image',
                coreValuesImageUrl: 'Contact Background Image',
              },
              editorDescription:
                'Update the Discipleship page title, tagline, mission statement, vision statement, curriculum, contact details, and the images used on the public page.',
              collectionEditors: {
                lessons: {
                  label: 'Lessons',
                  description: 'Manage the lesson cards shown on the public Discipleship page.',
                },
                coreValues: {
                  label: 'Core Values',
                  description: 'Manage the core values shown on the public Discipleship page.',
                },
              },
            }}
          />
        )}
        {activeTab === 'news' && (
          <NewsManager
            token={token}
            scope="discipleship"
            title="Discipleship Class news"
            description="Stories shown in the news section of the Discipleship Class page and at /news. Use Import older news once to bring across stories saved before."
          />
        )}
        {activeTab === 'events' && <SchoolMainEventsPanel schoolKey="discipleship" schoolName="Discipleship Class" publicHref="/schools/discipleship" />}
      </div>
    </div>
  );
}
