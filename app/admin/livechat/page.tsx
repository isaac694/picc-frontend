//app/admin/livechat/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';

type ChatThread = {
  videoId: string;
  videoTitle?: string | null;
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
  const [status, setStatus] = useState('');
  const [lastError, setLastError] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const youTubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

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

  const displayThreadTitle = (thread: ChatThread) => {
    if (thread.videoId === 'legacy') return 'Legacy Chat (pre-video)';
    const normalizedTitle = thread.videoTitle?.trim();
    return normalizedTitle || thread.videoId;
  };

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.videoId === selectedVideoId) || null,
    [threads, selectedVideoId]
  );

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter((thread) => {
      const title = displayThreadTitle(thread).toLowerCase();
      const date = formatDateTime(thread.lastMessageAt).toLowerCase();
      return title.includes(query) || date.includes(query);
    });
  }, [threads, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const readResponseDetail = async (response: Response) => {
    try {
      const text = await response.text();
      if (!text) {
        return `HTTP ${response.status} ${response.statusText}`.trim();
      }
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed?.message) {
          return `HTTP ${response.status} ${response.statusText} - ${parsed.message}`.trim();
        }
      } catch {
        // Ignore JSON parse errors and fall back to raw text
      }
      return `HTTP ${response.status} ${response.statusText} - ${text}`.trim();
    } catch {
      return `HTTP ${response.status} ${response.statusText}`.trim();
    }
  };

  const handleAdminLogout = () => {
    handleLogout();
    setSelectedVideoId(null);
    setMessages([]);
    setThreads([]);
    setStatus('');
    setLastError('');
  };

  const refreshThreads = async () => {
    if (!token) return;
    setIsLoadingThreads(true);
    setStatus('');
    setLastError('');
    try {
      const response = await apiFetch('/api/chat/admin/threads?take=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const detail = await readResponseDetail(response);
        setStatus('Unable to load chat threads.');
        setLastError(detail || `HTTP ${response.status}`);
        setThreads([]);
        return;
      }
      const data = await response.json();
      const list = data.threads || [];
      setThreads(list);
      void enrichThreadTitles(list);
    } catch {
      setStatus('Unable to load chat threads.');
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const enrichThreadTitles = async (list: ChatThread[]) => {
    if (!youTubeApiKey) return;
    const missing = list
      .filter((thread) => thread.videoId !== 'legacy')
      .filter((thread) => {
        const title = thread.videoTitle?.trim() || '';
        return !title || title === thread.videoId;
      })
      .map((thread) => thread.videoId);

    if (missing.length === 0) return;

    const resolved = new Map<string, string>();
    for (let i = 0; i < missing.length; i += 50) {
      const batch = missing.slice(i, i + 50);
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('id', batch.join(','));
        url.searchParams.set('key', youTubeApiKey);
        const res = await fetch(url.toString());
        if (!res.ok) continue;
        const data = await res.json().catch(() => null);
        const items = Array.isArray(data?.items) ? data.items : [];
        for (const item of items) {
          const id = typeof item?.id === 'string' ? item.id : null;
          const title = typeof item?.snippet?.title === 'string' ? item.snippet.title : null;
          if (id && title) {
            resolved.set(id, title);
          }
        }
      } catch {
        // ignore and keep existing titles
      }
    }

    if (resolved.size === 0) return;

    setThreads((prev) =>
      prev.map((thread) => {
        const title = resolved.get(thread.videoId);
        return title ? { ...thread, videoTitle: title } : thread;
      }),
    );
  };

  const loadMessages = async (videoId: string) => {
    if (!token) return;
    setIsLoadingMessages(true);
    setStatus('');
    setLastError('');
    try {
      const response = await apiFetch(
        `/api/chat/admin/messages?videoId=${encodeURIComponent(videoId)}&take=500`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const detail = await readResponseDetail(response);
        setStatus('Unable to load messages for that stream.');
        setLastError(detail || `HTTP ${response.status}`);
        setMessages([]);
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch {
      setStatus('Unable to load messages for that stream.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const deleteMessage = async (messageId: string, videoId: string) => {
    if (!token) return;
    setStatus('');
    setLastError('');
    try {
      const response = await apiFetch(`/api/chat/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const detail = await readResponseDetail(response);
        setStatus('Unable to delete message.');
        setLastError(detail || `HTTP ${response.status}`);
        toast.error('Unable to delete message.');
        return;
      }

      setStatus('Message deleted.');
      toast.success('Message deleted.');
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      await refreshThreads();
      if (selectedVideoId === videoId) {
        await loadMessages(videoId);
      }
    } catch {
      setStatus('Unable to delete message.');
      toast.error('Unable to delete message.');
    }
  };

  const requestDeleteMessage = (messageId: string, videoId: string) => {
    const toastId = toast('Delete this message?', {
      description: 'This action cannot be undone.',
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void deleteMessage(messageId, videoId);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          toast.dismiss(toastId);
        },
      },
    });
  };

  const handleSelectThread = (videoId: string) => {
    setSelectedVideoId(videoId);
    loadMessages(videoId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
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
        {token && (
          <Button variant="outline" onClick={handleAdminLogout}>
            Log out
          </Button>
        )}
      </div>

      {!token ? (
        <AdminLoginCard
          email={email}
          password={password}
          loginError={loginError}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={(event) => {
            setStatus('');
            setLastError('');
            return handleLogin(event);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Streams
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refreshThreads} disabled={isLoadingThreads}>
                  {isLoadingThreads ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <label htmlFor="livechat-search" className="sr-only">
                Search streams by title or date
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                  <input
                    id="livechat-search"
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="title or date"
                    className="w-full rounded-xl border border-border/60 bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>
            {threads.length === 0 ? (
              <p className="text-sm text-foreground/60">No chat threads yet.</p>
            ) : filteredThreads.length === 0 ? (
              <p className="text-sm text-foreground/60">No chat threads match your search.</p>
            ) : (
              <div className="space-y-3">
                {filteredThreads.map((thread) => (
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
                      {displayThreadTitle(thread)}
                    </p>
                    {thread.videoId !== 'legacy' &&
                    thread.videoTitle &&
                    thread.videoTitle.trim() &&
                    thread.videoTitle.trim() !== thread.videoId ? (
                      <p className="text-[11px] text-foreground/50 mt-1 break-all">
                        {thread.videoId}
                      </p>
                    ) : null}
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
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedThread ? 'Messages' : 'Select a Stream'}
                </h2>
                {selectedThread && (
                  <p className="text-sm text-foreground/60">
                    {displayThreadTitle(selectedThread)}
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
            {lastError && (
              <p className="text-xs text-red-600 mb-4">{lastError}</p>
            )}

            {isLoadingMessages ? (
              <p className="text-sm text-foreground/60">Loading messages...</p>
            ) : selectedThread ? (
              messages.length === 0 ? (
                <p className="text-sm text-foreground/60">No messages for this stream.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="group rounded-xl border border-border/60 bg-background p-3 relative"
                    >
                      <div className="flex items-center justify-between text-xs text-foreground/60 mb-2">
                        <span className="font-medium">{message.username}</span>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-foreground flex-1">{message.content}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-3 text-[11px] bg-red-600 hover:bg-red-700 text-white flex-shrink-0 transition-opacity md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto"
                          onClick={() => requestDeleteMessage(message.id, message.videoId)}
                        >
                          Delete
                        </Button>
                      </div>
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
  );
}


