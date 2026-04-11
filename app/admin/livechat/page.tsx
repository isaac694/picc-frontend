'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';

const TOKEN_KEY = 'picc_admin_token';

type ChatThread = {
  videoId: string;
  messageCount: number;
  lastMessageAt: string | null;
};

type ChatMessage = {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: string;
  videoId: string;
};

export default function LiveChatAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshThreads();
  }, [token]);

  const formatDateTime = (value: string | null) => {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayVideoId = (videoId: string) => {
    if (videoId === 'legacy') return 'Legacy Chat (pre-video)';
    return videoId;
  };

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.videoId === selectedVideoId) || null,
    [threads, selectedVideoId]
  );

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
    setSelectedVideoId(null);
    setMessages([]);
    setThreads([]);
    setStatus('');
  };

  const refreshThreads = async () => {
    if (!token) return;
    setIsLoadingThreads(true);
    setStatus('');
    try {
      const response = await fetch(apiUrl('/api/chat/admin/threads?take=200'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setStatus('Unable to load chat threads.');
        setThreads([]);
        return;
      }
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      setStatus('Unable to load chat threads.');
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (videoId: string) => {
    if (!token) return;
    setIsLoadingMessages(true);
    setStatus('');
    try {
      const response = await fetch(
        apiUrl(`/api/chat/admin/messages?videoId=${encodeURIComponent(videoId)}&take=500`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        setStatus('Unable to load messages for that stream.');
        setMessages([]);
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      setStatus('Unable to load messages for that stream.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectThread = (videoId: string) => {
    setSelectedVideoId(videoId);
    loadMessages(videoId);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
              Admin
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
              Live Chat Archive
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl">
              Review chat conversations by livestream video.
            </p>
            <div className="mt-4">
              <Link href="/admin" className="text-sm text-primary hover:underline">
                Admin Home
              </Link>
            </div>
          </div>

          {!token ? (
            <div className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Admin Login</h2>
              {loginError && (
                <p className="text-sm text-red-600 mb-3">{loginError}</p>
              )}
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
                <Button type="submit" className="w-full">
                  Log in
                </Button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Streams
                  </h2>
                  <Button variant="outline" size="sm" onClick={refreshThreads} disabled={isLoadingThreads}>
                    {isLoadingThreads ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
                {threads.length === 0 ? (
                  <p className="text-sm text-foreground/60">No chat threads yet.</p>
                ) : (
                  <div className="space-y-3">
                    {threads.map((thread) => (
                      <button
                        key={thread.videoId}
                        type="button"
                        onClick={() => handleSelectThread(thread.videoId)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selectedVideoId === thread.videoId
                            ? 'border-primary bg-primary/10'
                            : 'border-border/60 hover:border-primary/60'
                        }`}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {displayVideoId(thread.videoId)}
                        </p>
                        <p className="text-xs text-foreground/60 mt-1">
                          {thread.messageCount} messages
                        </p>
                        <p className="text-xs text-foreground/60">
                          Last message: {formatDateTime(thread.lastMessageAt)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {selectedThread ? 'Messages' : 'Select a Stream'}
                    </h2>
                    {selectedThread && (
                      <p className="text-sm text-foreground/60">
                        {displayVideoId(selectedThread.videoId)}
                      </p>
                    )}
                  </div>
                  {selectedThread && selectedThread.videoId !== 'legacy' && (
                    <a
                      href={`https://www.youtube.com/watch?v=${selectedThread.videoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open on YouTube
                    </a>
                  )}
                </div>

                {status && (
                  <p className="text-sm text-foreground/70 mb-4">{status}</p>
                )}

                {isLoadingMessages ? (
                  <p className="text-sm text-foreground/60">Loading messages...</p>
                ) : selectedThread ? (
                  messages.length === 0 ? (
                    <p className="text-sm text-foreground/60">No messages for this stream.</p>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {messages.map((message) => (
                        <div key={message.id} className="rounded-xl border border-border/60 bg-background p-3">
                          <div className="flex items-center justify-between text-xs text-foreground/60 mb-2">
                            <span>{message.username}</span>
                            <span>{formatDateTime(message.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-foreground/60">
                    Choose a stream from the left to view its chat history.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
