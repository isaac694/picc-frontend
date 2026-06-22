'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SiteNewsManager from '@/components/admin/SiteNewsManager';
import { YOUTH_CHURCH_NEWS_ITEMS, YOUTH_CHURCH_NEWS_KEY } from '@/components/youthChurchNews';
import {
  MinistryInfoManager,
  MinistryItemsManager,
  type MinistryInfo,
  type MinistryItem,
} from '@/components/admin/MinistryContentManagers';

type Tab = 'info' | 'arms' | 'youth-life' | 'initiatives' | 'events' | 'news';

const youthChurchFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Youth Church',
  motto: 'Helping young people grow in Christ and community.',
  about:
    'The Youth Church at PICC is a vibrant community where children, teenagers, and young adults can experience God in a way that is relevant to their lives. We believe that young people are not just the leaders of tomorrow, but the influencers of today.\n\nOur services are packed with high-energy worship, creative expressions, and transparent conversations about the issues young people face—from mental health and career choices to identity and spiritual growth. To properly minister to every age group, the Youth Church is comprised of four specialized sub-ministries.',
  heroImageUrl: '/hero/hero-2.jpg',
  logoImageUrl: '/logos/youth-church-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With Us',
  partnershipBody:
    'Equipping the next generation requires resources, dedicated mentors, and community support. You can partner with the Youth Church to fund our outreach programs, retreats, and mentorship camps.\n\nWhether you are investing in the Heritage Kids, Teens, Hope & Beauty, or CTG, your support helps us build strong foundations for tomorrow\'s leaders.',
  partnershipDetails: [],
  partnershipImageUrl: '/ministries/youth-church/partner.jpg',
  phone: 'Check with your local PICC branch for youth pastor contacts.',
  email: 'info@picc.org',
  location: 'PICC Youth Church\nCamp of God Cathedral',
  contactIntro:
    'Whether you\'re a teen looking for a community or an adult looking to mentor, we\'d love to hear from you.',
};

const ministryArms: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Called to Greatness (CTG)',
    description:
      'A dedicated ministry empowering young men and young adults to discover their God-given potential, achieve excellence in their careers, and lead with integrity in the modern world.',
    label: 'Young Men',
  },
  {
    title: 'Hope and Beauty',
    description:
      'A sisterhood focusing on mentoring and building up young women. We tackle real-life issues with biblical truth, encouraging grace, purity, and unwavering purpose in Christ.',
    label: 'Young Women',
  },
  {
    title: 'Teens Ministry',
    description:
      'Designed specifically for high schoolers, this vibrant arm helps teenagers navigate the pivotal years of youth with faith, fun, deep friendships, and solid biblical foundations.',
    label: 'Teenagers',
  },
  {
    title: 'Heritage Ministry',
    description:
      'Our children\'s church where we lay the early foundations of faith. We teach our youngest members the ways of the Lord through interactive lessons, songs, and age-appropriate play.',
    label: 'Children',
  },
];

const youthLifeGallery: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Youth Life 1', description: 'High-energy worship and sincere devotion.', imageUrl: '/images/youth-church/img-1.jpg' },
  { title: 'Youth Life 2', description: 'Hope and Beauty: Sisterhood in action.', imageUrl: '/images/youth-church/img-2.jpg' },
  { title: 'Youth Life 3', description: 'Called to Greatness: Building future leaders.', imageUrl: '/images/youth-church/img-3.jpg' },
  { title: 'Youth Life 4', description: 'Teens Ministry: Navigating life with faith.', imageUrl: '/images/youth-church/img-4.jpg' },
  { title: 'Youth Life 5', description: 'Heritage Ministry: Laying the early foundations.', imageUrl: '/images/youth-church/img-5.jpg' },
  { title: 'Youth Life 6', description: 'Growing in Christ and community together.', imageUrl: '/images/youth-church/img-6.jpg' },
];

const initiatives: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'University Mentorship Program', label: 'Ongoing', description: 'Campus Outreach', imageUrl: '/images/youth-church/img-4.jpg' },
  { title: 'High School Faith Clubs', label: 'Active', description: 'Teens Initiative', imageUrl: '/images/youth-church/img-3.jpg' },
  { title: 'Young Men’s Leadership Workshop', label: 'Active', description: 'CTG Project', imageUrl: '/images/youth-church/img-1.jpg' },
  { title: 'Purity & Purpose Seminar', label: 'Upcoming', description: 'Hope & Beauty', imageUrl: '/images/youth-church/img-2.jpg' },
  { title: 'Vacation Bible School', label: 'August 2026', description: 'Heritage', imageUrl: '/images/youth-church/img-6.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Youth Church Sunday Service',
    label: 'Every Sunday | 1:30 PM - 3:30 PM',
    description: 'Join us every Sunday for high-energy worship, creative expressions, and transparent conversations about the issues young people face. Bring a friend!',
    imageUrl: '/images/youth-church/img-1.jpg',
  },
  {
    title: '2026 Lake Retreat (Youth Church)',
    label: 'August 28 - 30, 2026',
    description: 'Our annual Youth Church Lake Retreat is back! Three days of disconnecting from the noise, encountering God, and building lifelong friendships on the shores of Lake Malawi.',
    imageUrl: '/images/youth-church/img-7.jpg',
  },
  {
    title: 'Inter-Church Sports Gala',
    label: 'March 28, 2026',
    description: 'We built community through competition and took home the trophy in the regional football tournament.',
    imageUrl: '/hero/hero-2.jpg',
  },
  {
    title: 'Heritage Kids Summer Camp',
    label: 'August 5-10, 2026',
    description: 'Five days of fun, character building, and teaching our youngest members the ways of the Lord through interactive lessons, songs, and age-appropriate play.',
    imageUrl: '/hero/hero-3.jpg',
  },
  {
    title: 'Hope & Beauty Mentorship Tea',
    label: 'September 12, 2026',
    description: 'An elegant afternoon dedicated to mentoring young women. We will be discussing grace, purity, and purpose over tea and pastries.',
    imageUrl: '/images/youth-church/img-2.jpg',
  },
];

export default function YouthChurchAdminPage() {
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
    { id: 'arms', label: 'Ministry Arms' },
    { id: 'youth-life', label: 'Youth Life' },
    { id: 'initiatives', label: 'Initiatives' },
    { id: 'events', label: 'Events' },
    { id: 'news', label: 'News' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Youth Church Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage logo, motto, hero picture, about text, ministry arms, youth life gallery,
            initiatives, events, partnership details, phone number, and email.
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
          ministryKey="youth-church"
          ministryName="Youth Church"
          fallbackInfo={youthChurchFallbackInfo}
        />
      )}

      {activeTab === 'arms' && (
        <MinistryItemsManager
          token={token}
          ministryKey="youth-church"
          category="arm"
          title="Ministry Arms"
          description="Manage the specialized sub-ministries that make up the Youth Church."
          fallbackItems={ministryArms}
          labels={{ title: 'Arm Title', description: 'Arm Description', label: 'Target Group', save: 'Save Arm' }}
          showImage={false}
        />
      )}

      {activeTab === 'youth-life' && (
        <MinistryItemsManager
          token={token}
          ministryKey="youth-church"
          category="youth-life"
          title="Youth Life Gallery"
          description="Manage the pictures shown in the Youth Life gallery section."
          fallbackItems={youthLifeGallery}
          labels={{ title: 'Picture Title', description: 'Caption', image: 'Gallery Picture', save: 'Save Picture', formTitle: 'Save Gallery Picture' }}
          showLabel={false}
          showSortOrder={false}
          maxItems={6}
        />
      )}

      {activeTab === 'initiatives' && (
        <MinistryItemsManager
          token={token}
          ministryKey="youth-church"
          category="initiative"
          title="Ministry Initiatives"
          description="Manage current and future Youth Church projects and initiatives."
          fallbackItems={initiatives}
          labels={{ title: 'Initiative Title', description: 'Category / Department', label: 'Status', image: 'Initiative Image' }}
          showSortOrder={false}
        />
      )}

      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="youth-church"
          category="event"
          title="Upcoming & Past Events"
          description="Manage upcoming and past Youth Church events."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date / Time', image: 'Event Picture', save: 'Save Event' }}
          showPaymentFields
          defaultPaymentAccount="youth"
        />
      )}

      {activeTab === 'news' && (
        <SiteNewsManager
          token={token}
          contentKey={YOUTH_CHURCH_NEWS_KEY}
          title="Youth Church News"
          description="Manage the Latest News section shown on the public Youth Church page."
          fallbackItems={YOUTH_CHURCH_NEWS_ITEMS}
          maxItems={YOUTH_CHURCH_NEWS_ITEMS.length}
        />
      )}
    </div>
  );
}
