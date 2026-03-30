'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';

const TOKEN_KEY = 'picc_admin_token';

const IMAGE_SECTIONS = [
  {
    id: 'home',
    title: 'Home Page Images',
    description: 'Update hero, mission, and ministry visuals used on the home page.',
    items: [
      { key: 'home-hero-1', label: 'Hero Image 1', fallback: '/hero/hero-4.JPG' },
      { key: 'home-hero-2', label: 'Hero Image 2', fallback: '/hero/hero-10.JPG' },
      { key: 'home-hero-3', label: 'Hero Image 3', fallback: '/hero/hero-9.JPG' },
      { key: 'home-hero-4', label: 'Hero Image 4', fallback: '/hero/hero-8.JPG' },
      { key: 'home-hero-5', label: 'Hero Image 5', fallback: '/hero/hero-7.JPG' },
      { key: 'home-hero-6', label: 'Hero Image 6', fallback: '/hero/hero-2.jpg' },
      { key: 'home-hero-7', label: 'Hero Image 7', fallback: '/hero/hero-1.jpg' },
      { key: 'home-hero-8', label: 'Hero Image 8', fallback: '/hero/hero-5.jpg' },
      { key: 'home-hero-9', label: 'Hero Image 9', fallback: '/hero/hero-3.JPG' },
      { key: 'home-mission-image', label: 'Our Mission Image', fallback: '/images/pastor-preaching-bw.jpg' },
      { key: 'home-grow-card-1', label: 'Grow Card 1', fallback: '/cards/about-church.jpg' },
      { key: 'home-grow-card-2', label: 'Grow Card 2', fallback: '/cards/service-times.jpg' },
      { key: 'home-grow-card-3', label: 'Grow Card 3', fallback: '/cards/upcoming-events.jpg' },
      { key: 'home-grow-card-4', label: 'Grow Card 4', fallback: '/cards/give-offerings.jpg' },
      { key: 'home-pastors-image', label: 'Our Pastors Image', fallback: '/images/pastor-preaching-bw.jpg' },
      { key: 'home-listen-now-bg', label: 'Listen Now Background', fallback: '/pastor/pastor-photo.jpg' },
      { key: 'home-ministry-card-1', label: 'You Were Made For This 1', fallback: '/hero/hero-2.jpg' },
      { key: 'home-ministry-card-2', label: 'You Were Made For This 2', fallback: '/hero/hero-5.jpg' },
      { key: 'home-ministry-card-3', label: 'You Were Made For This 3', fallback: '/hero/hero-1.jpg' },
      { key: 'home-ministry-card-4', label: 'You Were Made For This 4', fallback: '/hero/hero-6.jpg' },
      { key: 'home-ministry-card-5', label: 'You Were Made For This 5', fallback: '/hero/hero-3.jpg' },
      { key: 'home-ministry-card-6', label: 'You Were Made For This 6', fallback: '/hero/hero-4.jpg' },
      { key: 'home-ministry-card-7', label: 'You Were Made For This 7', fallback: '/cards/about-church.jpg' },
      { key: 'home-livestream-bg', label: "Listen to God's Word Background", fallback: '/hero/hero-6.jpg' },
    ],
  },
  {
    id: 'about',
    title: 'About Page Images',
    description: 'Images for About page hero, tenets, values, and yearly themes.',
    items: [
      { key: 'about-header-bg', label: 'About Header Background', fallback: '/about/header.JPG' },
      { key: 'about-tenets-image', label: 'Tenets of Faith Image', fallback: '/about/tenets-1.JPG' },
      { key: 'about-core-values-image', label: 'Core Values Image', fallback: '/about/core-values.JPG' },
      { key: 'about-themes-bg', label: 'Yearly Themes Background', fallback: '/about/themes.jpeg' },
      { key: 'about-worship-image', label: 'Worship With Us Image', fallback: '/about/worship-with-us.jpg' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact Page Images',
    description: 'Hero, location, and contact form images for the Contact page.',
    items: [
      { key: 'contact-header-bg', label: 'Contact Header Background', fallback: '/images/our-church.JPG' },
      { key: 'contact-locate-image', label: 'Locate Us Image', fallback: '/images/our-church.JPG' },
      { key: 'contact-send-message-image', label: 'Send Us a Message Image', fallback: '/images/send-message-2.JPG' },
    ],
  },
];

export default function DevotionsAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [publishTime, setPublishTime] = useState('01:00');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDevotions, setAllDevotions] = useState<any[]>([]);
  const [seeYouTitle, setSeeYouTitle] = useState('See You In Church');
  const [seeYouSubtitle, setSeeYouSubtitle] = useState('Grow deeper in your walk with God this week.');
  const [seeYouImageUrl, setSeeYouImageUrl] = useState('/home/see-you-in-church.JPG');
  const [services, setServices] = useState<any[]>([]);
  const [serviceDraft, setServiceDraft] = useState({
    title: '',
    dayOfWeek: '',
    time: '',
    location: '',
    description: '',
  });
  const [events, setEvents] = useState<any[]>([]);
  const [eventDraft, setEventDraft] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    description: '',
    imageUrl: '',
  });
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteImageUrl, setQuoteImageUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [savingImages, setSavingImages] = useState(false);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchDevotion = async () => {
      setLoading(true);
      setStatus('');
      try {
        const response = await fetch(apiUrl(`/api/devotions?date=${date}`));
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title || '');
          setContent(data.content || '');
          if (data.publishAt) {
            const parsed = new Date(data.publishAt);
            if (!Number.isNaN(parsed.getTime())) {
              const hours = String(parsed.getHours()).padStart(2, '0');
              const minutes = String(parsed.getMinutes()).padStart(2, '0');
              setPublishTime(`${hours}:${minutes}`);
            }
          }
        } else if (response.status === 404) {
          setTitle('');
          setContent('');
        } else {
          setStatus('Unable to load devotion for that date.');
        }
      } catch (error) {
        setStatus('Unable to load devotion for that date.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevotion();
  }, [token, date]);

  useEffect(() => {
    if (!token) return;

    const fetchAllDevotions = async () => {
      try {
        const response = await fetch(apiUrl('/api/devotions/admin?take=500'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setAllDevotions(data.devotions || []);
      } catch (error) {
        setAllDevotions([]);
      }
    };

    fetchAllDevotions();
  }, [token, status]);

  useEffect(() => {
    if (!token) return;

    const fetchAdminContent = async () => {
      try {
        const [seeYouRes, servicesRes, eventsRes, quoteRes] = await Promise.all([
          fetch(apiUrl('/api/site-content/see-you-in-church')),
          fetch(apiUrl('/api/services')),
          fetch(apiUrl('/api/events?take=200')),
          fetch(apiUrl('/api/quote-of-month')),
        ]);

        if (seeYouRes.ok) {
          const data = await seeYouRes.json();
          setSeeYouTitle(data.title || 'See You In Church');
          setSeeYouSubtitle(data.subtitle || 'Grow deeper in your walk with God this week.');
          const imageUrl = data.imageUrl
            ? data.imageUrl.startsWith('http')
              ? data.imageUrl
              : apiUrl(data.imageUrl)
            : '';
          setSeeYouImageUrl(imageUrl);
        }

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          const normalized = (data || []).map((service: any) => ({
            ...service,
            time: service.startTime
              ? service.endTime
                ? `${service.startTime} - ${service.endTime}`
                : service.startTime
              : service.time || '',
          }));
          setServices(normalized);
        }

        if (eventsRes.ok) {
          const data = await eventsRes.json();
          const normalized = (data.events || []).map((event: any) => ({
            ...event,
            date: event.date ? String(event.date).slice(0, 10) : '',
            imageUrl: event.imageUrl
              ? event.imageUrl.startsWith('http')
                ? event.imageUrl
                : apiUrl(event.imageUrl)
              : '',
          }));
          setEvents(normalized);
        }

        if (quoteRes.ok) {
          const data = await quoteRes.json();
          setQuoteText(data.quote || '');
          setQuoteAuthor(data.author || '');
          const imageUrl = data.imageUrl
            ? data.imageUrl.startsWith('http')
              ? data.imageUrl
              : apiUrl(data.imageUrl)
            : '';
          setQuoteImageUrl(imageUrl);
        }

        const imageKeys = IMAGE_SECTIONS.flatMap((section) => section.items.map((item) => item.key));
        const imageEntries = await Promise.all(
          imageKeys.map(async (key) => {
            try {
              const response = await fetch(apiUrl(`/api/site-content/${key}`));
              if (!response.ok) {
                return [key, ''] as const;
              }
              const data = await response.json();
              const imageUrl = data.imageUrl
                ? data.imageUrl.startsWith('http')
                  ? data.imageUrl
                  : apiUrl(data.imageUrl)
                : '';
              return [key, imageUrl] as const;
            } catch (error) {
              return [key, ''] as const;
            }
          })
        );

        setPageImages(Object.fromEntries(imageEntries));
      } catch (error) {
        // ignore fetch errors here; individual sections can still work
      }
    };

    fetchAdminContent();
  }, [token]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setStatus('');

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setLoginError('Invalid email or password.');
        return;
      }

      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setEmail('');
      setPassword('');
    } catch (error) {
      setLoginError('Unable to log in right now.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTitle('');
    setContent('');
    setStatus('');
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setStatus('Please add devotion content before saving.');
      return;
    }

    const publishAt = `${date}T${publishTime}:00`;

    setStatus('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/devotions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, title, content, publishAt }),
      });

      if (!response.ok) {
        setStatus('Unable to save devotion. Please try again.');
        return;
      }

      setStatus('Devotion saved.');
    } catch (error) {
      setStatus('Unable to save devotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSeeYouInChurch = async () => {
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/site-content/see-you-in-church'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: seeYouTitle,
          subtitle: seeYouSubtitle,
          imageUrl: seeYouImageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save See You in Church settings.');
        return;
      }
      setStatus('See You in Church section updated.');
    } catch (error) {
      setStatus('Unable to save See You in Church settings.');
    }
  };

  const refreshServices = async () => {
    try {
      const response = await fetch(apiUrl('/api/services'));
      if (!response.ok) return;
      const data = await response.json();
      const normalized = (data || []).map((service: any) => ({
        ...service,
        time: service.startTime
          ? service.endTime
            ? `${service.startTime} - ${service.endTime}`
            : service.startTime
          : service.time || '',
      }));
      setServices(normalized);
    } catch (error) {
      setServices([]);
    }
  };

  const handleAddService = async () => {
    if (!serviceDraft.title || !serviceDraft.dayOfWeek || !serviceDraft.time) {
      setStatus('Please fill service title, day, and time.');
      return;
    }
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/services'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: serviceDraft.title,
          dayOfWeek: serviceDraft.dayOfWeek,
          time: serviceDraft.time,
          location: serviceDraft.location,
          description: serviceDraft.description,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to add service.');
        return;
      }
      setServiceDraft({
        title: '',
        dayOfWeek: '',
        time: '',
        location: '',
        description: '',
      });
      await refreshServices();
      setStatus('Service added.');
    } catch (error) {
      setStatus('Unable to add service.');
    }
  };

  const handleUpdateService = async (service: any) => {
    setStatus('');
    try {
      const response = await fetch(apiUrl(`/api/services/${service.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: service.title,
          dayOfWeek: service.dayOfWeek,
          time: service.time || service.startTime,
          location: service.location,
          description: service.description,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to update service.');
        return;
      }
      await refreshServices();
      setStatus('Service updated.');
    } catch (error) {
      setStatus('Unable to update service.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setStatus('');
    try {
      const response = await fetch(apiUrl(`/api/services/${serviceId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setStatus('Unable to delete service.');
        return;
      }
      await refreshServices();
      setStatus('Service deleted.');
    } catch (error) {
      setStatus('Unable to delete service.');
    }
  };

  const refreshEvents = async () => {
    try {
      const response = await fetch(apiUrl('/api/events?take=200'));
      if (!response.ok) return;
      const data = await response.json();
      const normalized = (data.events || []).map((event: any) => ({
        ...event,
        date: event.date ? String(event.date).slice(0, 10) : '',
        imageUrl: event.imageUrl
          ? event.imageUrl.startsWith('http')
            ? event.imageUrl
            : apiUrl(event.imageUrl)
          : '',
      }));
      setEvents(normalized);
    } catch (error) {
      setEvents([]);
    }
  };

  const handleAddEvent = async () => {
    if (!eventDraft.title || !eventDraft.date) {
      setStatus('Please fill event title and date.');
      return;
    }
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventDraft.title,
          date: eventDraft.date,
          location: eventDraft.location,
          description: eventDraft.description,
          imageUrl: eventDraft.imageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to add event.');
        return;
      }
      setEventDraft({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        location: '',
        description: '',
        imageUrl: '',
      });
      await refreshEvents();
      setStatus('Event added.');
    } catch (error) {
      setStatus('Unable to add event.');
    }
  };

  const handleUpdateEvent = async (event: any) => {
    setStatus('');
    try {
      const response = await fetch(apiUrl(`/api/events/${event.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          location: event.location,
          description: event.description,
          imageUrl: event.imageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to update event.');
        return;
      }
      await refreshEvents();
      setStatus('Event updated.');
    } catch (error) {
      setStatus('Unable to update event.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setStatus('');
    try {
      const response = await fetch(apiUrl(`/api/events/${eventId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setStatus('Unable to delete event.');
        return;
      }
      await refreshEvents();
      setStatus('Event deleted.');
    } catch (error) {
      setStatus('Unable to delete event.');
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteText.trim()) {
      setStatus('Please add a quote before saving.');
      return;
    }
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/quote-of-month'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quote: quoteText,
          author: quoteAuthor,
          imageUrl: quoteImageUrl,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save quote of the month.');
        return;
      }
      setStatus('Quote of the month updated.');
    } catch (error) {
      setStatus('Unable to save quote of the month.');
    }
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(apiUrl('/api/uploads'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        setStatus('Image upload failed.');
        return null;
      }
      const data = await response.json();
      return apiUrl(data.url);
    } catch (error) {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const updatePageImage = (key: string, value: string) => {
    setPageImages((prev) => ({ ...prev, [key]: value }));
  };

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const saveImageSection = async (sectionId: string) => {
    if (!token) return;
    const section = IMAGE_SECTIONS.find((item) => item.id === sectionId);
    if (!section) return;
    setSavingImages(true);
    setStatus('');
    try {
      const responses = await Promise.all(
        section.items.map((item) =>
          fetch(apiUrl(`/api/site-content/${item.key}`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageUrl: pageImages[item.key] || null,
            }),
          })
        )
      );
      if (responses.some((response) => !response.ok)) {
        setStatus(`Unable to save ${section.title.toLowerCase()}.`);
        return;
      }
      setStatus(`${section.title} updated.`);
    } catch (error) {
      setStatus(`Unable to save ${section.title.toLowerCase()}.`);
    } finally {
      setSavingImages(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Admin
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowPreview((prev) => !prev)}>
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Link href="/admin" className="text-sm text-primary hover:underline">
                Admin Home
              </Link>
              <Link href="/" className="text-sm text-primary hover:underline">
                Back to Home
              </Link>
            </div>
          </div>

        {!token ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  required
                />
              </div>
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <Button type="submit" className="w-full sm:w-auto px-6 py-3">
                Sign In
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Edit Devotion</h2>
                  <p className="text-sm text-foreground/60">
                    Update the devotion for the selected date.
                  </p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Publish Time
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="time"
                      value={publishTime}
                      onChange={(event) => setPublishTime(event.target.value)}
                      className="w-full sm:w-44 rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPublishTime('01:00')}
                    >
                      Set to 1:00 AM
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/60 mt-2">
                    Posts are typically scheduled for 1:00 AM.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Devotion Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={8}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                {status && <p className="text-sm text-foreground/70">{status}</p>}
                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Devotion'}
                  </Button>
                  {loading && (
                    <span className="text-sm text-foreground/60">Working…</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Published vs Scheduled
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/60 mb-3">
                    Published
                  </p>
                  <div className="space-y-3">
                    {allDevotions.filter((item) => new Date(item.publishAt) <= new Date()).length === 0 ? (
                      <p className="text-sm text-foreground/60">No published devotions yet.</p>
                    ) : (
                      allDevotions
                        .filter((item) => new Date(item.publishAt) <= new Date())
                        .slice(0, 8)
                        .map((item) => (
                          <div key={item.id} className="rounded-xl border border-border/60 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                              {new Date(item.publishAt).toLocaleString()}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {item.title || 'Daily Devotion'}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/60 mb-3">
                    Scheduled
                  </p>
                  <div className="space-y-3">
                    {allDevotions.filter((item) => new Date(item.publishAt) > new Date()).length === 0 ? (
                      <p className="text-sm text-foreground/60">No scheduled devotions.</p>
                    ) : (
                      allDevotions
                        .filter((item) => new Date(item.publishAt) > new Date())
                        .slice(0, 8)
                        .map((item) => (
                          <div key={item.id} className="rounded-xl border border-border/60 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                              {new Date(item.publishAt).toLocaleString()}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {item.title || 'Daily Devotion'}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                See You in Church Section
              </h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={seeYouTitle}
                    onChange={(event) => setSeeYouTitle(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={seeYouSubtitle}
                    onChange={(event) => setSeeYouSubtitle(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Upload Background Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) {
                        setSeeYouImageUrl(url);
                        updateUploadName('see-you', file.name);
                      }
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSeeYouImageUrl('');
                      updateUploadName('see-you', '');
                    }}
                  >
                    Remove Background Image
                  </Button>
                </div>
                {seeYouImageUrl && (
                  <div className="rounded-xl border border-border/60 bg-background p-3">
                    <div
                      className="h-32 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${seeYouImageUrl})` }}
                    />
                    <p className="mt-2 text-xs text-foreground/60">
                      {uploadNames['see-you'] ? `Selected: ${uploadNames['see-you']}` : 'Current image'}
                    </p>
                  </div>
                )}
                <div>
                  <Button onClick={saveSeeYouInChurch}>
                    Save Section
                  </Button>
                </div>
                {showPreview && (
                  <div className="mt-4 rounded-2xl border border-border/60 overflow-hidden">
                    <div
                      className="relative h-48 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${seeYouImageUrl || '/home/see-you-in-church.JPG'})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/55" />
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
                        <p className="text-lg font-semibold">{seeYouTitle}</p>
                        <p className="text-sm text-white/80">{seeYouSubtitle}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Service Schedule
              </h2>
              <div className="grid gap-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Service title"
                    value={serviceDraft.title}
                    onChange={(event) => setServiceDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Day (e.g. Sunday)"
                    value={serviceDraft.dayOfWeek}
                    onChange={(event) => setServiceDraft((prev) => ({ ...prev, dayOfWeek: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Time (e.g. 7:00 AM - 12:00 PM)"
                    value={serviceDraft.time}
                    onChange={(event) => setServiceDraft((prev) => ({ ...prev, time: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={serviceDraft.location}
                    onChange={(event) => setServiceDraft((prev) => ({ ...prev, location: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={serviceDraft.description}
                    onChange={(event) => setServiceDraft((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <Button onClick={handleAddService}>Add Service</Button>
                </div>
              </div>

              <div className="space-y-4">
                {services.length === 0 ? (
                  <p className="text-sm text-foreground/60">No services yet.</p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="rounded-xl border border-border/60 bg-background p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={service.title || ''}
                          onChange={(event) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id ? { ...item, title: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                        <input
                          type="text"
                          value={service.dayOfWeek || ''}
                          onChange={(event) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id ? { ...item, dayOfWeek: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                        <input
                          type="text"
                          value={service.time || ''}
                          onChange={(event) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id ? { ...item, time: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          value={service.location || ''}
                          onChange={(event) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id ? { ...item, location: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                        <input
                          type="text"
                          value={service.description || ''}
                          onChange={(event) =>
                            setServices((prev) =>
                              prev.map((item) =>
                                item.id === service.id ? { ...item, description: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={() => handleUpdateService(service)}>Update</Button>
                        <Button variant="outline" onClick={() => handleDeleteService(service.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Upcoming Events
              </h2>
              <div className="grid gap-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Event title"
                    value={eventDraft.title}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                  <input
                    type="date"
                    value={eventDraft.date}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Location"
                    value={eventDraft.location}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, location: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Upload Event Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) {
                        setEventDraft((prev) => ({ ...prev, imageUrl: url }));
                        updateUploadName('event-draft', file.name);
                      }
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEventDraft((prev) => ({ ...prev, imageUrl: '' }));
                      updateUploadName('event-draft', '');
                    }}
                  >
                    Remove Event Image
                  </Button>
                </div>
                {eventDraft.imageUrl && (
                  <div className="rounded-xl border border-border/60 bg-background p-3">
                    <div
                      className="h-32 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${eventDraft.imageUrl})` }}
                    />
                    <p className="mt-2 text-xs text-foreground/60">
                      {uploadNames['event-draft'] ? `Selected: ${uploadNames['event-draft']}` : 'Current image'}
                    </p>
                  </div>
                )}
                <div>
                  <textarea
                    placeholder="Description"
                    value={eventDraft.description}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <Button onClick={handleAddEvent}>Add Event</Button>
                </div>
              </div>

              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-sm text-foreground/60">No events yet.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-border/60 bg-background p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={event.title || ''}
                          onChange={(e) =>
                            setEvents((prev) =>
                              prev.map((item) => (item.id === event.id ? { ...item, title: e.target.value } : item))
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                        <input
                          type="date"
                          value={event.date || ''}
                          onChange={(e) =>
                            setEvents((prev) =>
                              prev.map((item) => (item.id === event.id ? { ...item, date: e.target.value } : item))
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          value={event.location || ''}
                          onChange={(e) =>
                            setEvents((prev) =>
                              prev.map((item) => (item.id === event.id ? { ...item, location: e.target.value } : item))
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs uppercase tracking-[0.25em] text-foreground/50 mb-2">
                          Upload Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            setEvents((prev) =>
                              prev.map((item) => (item.id === event.id ? { ...item, imageUrl: url } : item))
                            );
                            updateUploadName(`event-${event.id}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          onClick={() =>
                            {
                              setEvents((prev) =>
                                prev.map((item) => (item.id === event.id ? { ...item, imageUrl: '' } : item))
                              );
                              updateUploadName(`event-${event.id}`, '');
                            }
                          }
                        >
                          Remove Event Image
                        </Button>
                      </div>
                      {event.imageUrl && (
                        <div className="mt-3 rounded-xl border border-border/60 bg-background p-3">
                          <div
                            className="h-28 rounded-lg bg-cover bg-center"
                            style={{ backgroundImage: `url(${event.imageUrl})` }}
                          />
                          <p className="mt-2 text-xs text-foreground/60">
                            {uploadNames[`event-${event.id}`]
                              ? `Selected: ${uploadNames[`event-${event.id}`]}`
                              : 'Current image'}
                          </p>
                        </div>
                      )}
                      <div className="mt-3">
                        <textarea
                          value={event.description || ''}
                          onChange={(e) =>
                            setEvents((prev) =>
                              prev.map((item) => (item.id === event.id ? { ...item, description: e.target.value } : item))
                            )
                          }
                          rows={3}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={() => handleUpdateEvent(event)}>Update</Button>
                        <Button variant="outline" onClick={() => handleDeleteEvent(event.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {showPreview && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.slice(0, 4).map((event) => (
                    <div key={`preview-${event.id}`} className="rounded-xl border border-border/60 overflow-hidden bg-background">
                      <div
                        className="h-36 bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.imageUrl || '/events/event-1.jpg'})` }}
                      />
                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                          {event.date}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Quote of the Month
              </h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quote
                  </label>
                  <textarea
                    value={quoteText}
                    onChange={(event) => setQuoteText(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      value={quoteAuthor}
                      onChange={(event) => setQuoteAuthor(event.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Upload Quote Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) {
                        setQuoteImageUrl(url);
                        updateUploadName('quote', file.name);
                      }
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuoteImageUrl('');
                      updateUploadName('quote', '');
                    }}
                  >
                    Remove Quote Photo
                  </Button>
                </div>
                {quoteImageUrl && (
                  <div className="rounded-xl border border-border/60 bg-background p-3">
                    <div
                      className="h-32 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${quoteImageUrl})` }}
                    />
                    <p className="mt-2 text-xs text-foreground/60">
                      {uploadNames.quote ? `Selected: ${uploadNames.quote}` : 'Current image'}
                    </p>
                  </div>
                )}
                <div>
                  <Button onClick={handleSaveQuote}>Save Quote</Button>
                </div>
                {showPreview && (
                  <div className="mt-4 rounded-2xl border border-border/60 bg-background p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
                      Preview
                    </p>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      &ldquo;{quoteText || 'Quote of the month'}&rdquo;
                    </p>
                    <p className="text-sm text-foreground/60">{quoteAuthor || 'Author'}</p>
                    {quoteImageUrl && (
                      <div
                        className="mt-4 h-40 rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${quoteImageUrl})` }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Page Images</h2>
                  <p className="text-sm text-foreground/60">
                    Upload new images for the Home, About, and Contact pages.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/40">
                  {savingImages ? 'Saving...' : 'Images'}
                </div>
              </div>

              <div className="space-y-10">
                {IMAGE_SECTIONS.map((section) => (
                  <div key={section.id} className="rounded-2xl border border-border/60 bg-background p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                          {section.title}
                        </p>
                        <p className="text-sm text-foreground/60">{section.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => saveImageSection(section.id)}
                        disabled={savingImages}
                      >
                        Save {section.title}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {section.items.map((item) => {
                        const currentUrl = pageImages[item.key] || '';
                        const previewUrl = currentUrl || item.fallback;
                        return (
                          <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                <p className="text-[11px] text-foreground/50">{item.key}</p>
                              </div>
                              <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                                {currentUrl ? 'Custom' : 'Default'}
                              </span>
                            </div>
                            <div
                              className="h-40 rounded-xl border border-border/60 bg-cover bg-center"
                              style={{ backgroundImage: `url(${previewUrl})` }}
                            />
                            <div className="mt-4 space-y-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadImage(file);
                                  if (!url) return;
                                  updatePageImage(item.key, url);
                                  updateUploadName(`page-${item.key}`, file.name);
                                }}
                                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  updatePageImage(item.key, '');
                                  updateUploadName(`page-${item.key}`, '');
                                }}
                              >
                                Remove Image
                              </Button>
                              {uploadNames[`page-${item.key}`] && (
                                <p className="text-xs text-foreground/60">
                                  Selected: {uploadNames[`page-${item.key}`]}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
