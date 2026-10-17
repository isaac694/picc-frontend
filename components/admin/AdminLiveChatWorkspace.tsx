'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  Tv,
  Users,
} from 'lucide-react';
import { apiFetch, messageFromApiPayload } from '@/lib/api';
import {
  fetchYouTubeVideoTitles,
  isGenericLiveChatTitle,
  isValidYouTubeVideoId,
} from '@/lib/youtube-client';
import { fetchYouTubeVideoTitleFromApp } from '@/lib/youtube-video-title-client';
import { Button } from '@/components/ui/button';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { toast } from 'sonner';

export type ChatThread = {
  videoId: string;
  videoTitle?: string | null;
  messageCount: number;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: string;
  videoId: string;
};

type MessageGroup = {
  key: string;
  label: string;
  items: ChatMessage[];
};

function formatDateTime(value: string | null) {
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
}

function formatTimeOnly(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function relativeLastActive(value: string | null) {
  if (!value) return 'No activity';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No activity';
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDateTime(value);
}

function dayGroupLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function groupMessagesByDay(messages: ChatMessage[]): MessageGroup[] {
  const map = new Map<string, MessageGroup>();
  for (const message of messages) {
    const key = new Date(message.createdAt).toDateString();
    const existing = map.get(key);
    if (existing) {
      existing.items.push(message);
    } else {
      map.set(key, {
        key,
        label: dayGroupLabel(message.createdAt),
        items: [message],
      });
    }
  }
  return Array.from(map.values());
}

function displayThreadTitle(thread: ChatThread) {
  if (thread.videoId === 'legacy') return 'Legacy chat (pre-video)';
  const normalizedTitle = thread.videoTitle?.trim();
  if (normalizedTitle && !isGenericLiveChatTitle(normalizedTitle)) {
    return normalizedTitle;
  }
  return thread.videoId;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function avatarHue(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

async function readResponseDetail(response: Response) {
  try {
    const text = await response.text();
    if (!text) return `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as unknown;
      return messageFromApiPayload(parsed, `HTTP ${response.status} — ${text.slice(0, 120)}`);
    } catch {
      return text.slice(0, 200) || `HTTP ${response.status}`;
    }
  } catch {
    return `HTTP ${response.status}`;
  }
}

export default function AdminLiveChatWorkspace({ token }: { token: string }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadSearch, setThreadSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const youTubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.videoId === selectedVideoId) || null,
    [threads, selectedVideoId],
  );

  const totalMessages = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.messageCount || 0), 0),
    [threads],
  );

  const uniqueChatters = useMemo(() => {
    const names = new Set(messages.map((m) => m.username));
    return names.size;
  }, [messages]);

  const filteredThreads = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) => {
      const title = displayThreadTitle(thread).toLowerCase();
      const id = thread.videoId.toLowerCase();
      const date = formatDateTime(thread.lastMessageAt).toLowerCase();
      return title.includes(query) || id.includes(query) || date.includes(query);
    });
  }, [threads, threadSearch]);

  const visibleMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(query) ||
        m.username.toLowerCase().includes(query),
    );
  }, [messages, messageSearch]);

  const messageGroups = useMemo(() => groupMessagesByDay(visibleMessages), [visibleMessages]);

  const enrichThreadTitles = useCallback(
    async (list: ChatThread[]) => {
      if (!youTubeApiKey) return;
      const missing = list
        .filter((thread) => thread.videoId !== 'legacy')
        .filter((thread) => {
          const title = thread.videoTitle?.trim() || '';
          return !title || title === thread.videoId || isGenericLiveChatTitle(title);
        })
        .map((thread) => thread.videoId);

      if (missing.length === 0) return;

      const resolved = await fetchYouTubeVideoTitles(missing, youTubeApiKey);
      const stillMissing = missing.filter((id) => !resolved.has(id));
      if (stillMissing.length > 0) {
        await Promise.all(
          stillMissing.map(async (id) => {
            if (!isValidYouTubeVideoId(id)) return;
            const title = await fetchYouTubeVideoTitleFromApp(id);
            if (title) resolved.set(id, title);
          }),
        );
      }
      if (resolved.size === 0) return;
      setThreads((prev) =>
        prev.map((thread) => {
          const title = resolved.get(thread.videoId);
          return title ? { ...thread, videoTitle: title } : thread;
        }),
      );
    },
    [youTubeApiKey],
  );

  const refreshThreads = useCallback(async () => {
    if (!token) return;
    setIsLoadingThreads(true);
    try {
      const response = await apiFetch('/api/chat/admin/threads?take=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const detail = await readResponseDetail(response);
        toast.error(detail || 'Unable to load chat threads.');
        setThreads([]);
        return;
      }
      const data = await response.json();
      const list = (data.threads || []) as ChatThread[];
      setThreads(list);
      void enrichThreadTitles(list);
    } catch {
      toast.error('Unable to load chat threads.');
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [token, enrichThreadTitles]);

  const loadMessages = useCallback(
    async (videoId: string) => {
      if (!token) return;
      setIsLoadingMessages(true);
      setMessageSearch('');
      try {
        const response = await apiFetch(
          `/api/chat/admin/messages?videoId=${encodeURIComponent(videoId)}&take=500`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
          const detail = await readResponseDetail(response);
          toast.error(detail || 'Unable to load messages.');
          setMessages([]);
          return;
        }
        const data = await response.json();
        setMessages(data.messages || []);
      } catch {
        toast.error('Unable to load messages.');
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load when token is available
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMessages, selectedVideoId]);

  const deleteMessage = async (messageId: string, videoId: string) => {
    if (!token) return;
    setDeletingId(messageId);
    try {
      const response = await apiFetch(`/api/chat/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        toast.error('Unable to delete message.');
        return;
      }
      toast.success('Message removed.');
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      await refreshThreads();
      if (selectedVideoId === videoId) {
        await loadMessages(videoId);
      }
    } catch {
      toast.error('Unable to delete message.');
    } finally {
      setDeletingId(null);
    }
  };

  const requestDeleteMessage = (message: ChatMessage) => {
    confirmDeleteToast({
      title: 'Remove this chat message?',
      description: (
        <span className="line-clamp-2 text-muted-foreground">
          &ldquo;{message.content.slice(0, 120)}
          {message.content.length > 120 ? '…' : ''}&rdquo;
        </span>
      ),
      onConfirm: () => deleteMessage(message.id, message.videoId),
    });
  };

  const handleSelectThread = (videoId: string) => {
    setSelectedVideoId(videoId);
    void loadMessages(videoId);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/55">Streams</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{threads.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <MessagesSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/55">Total messages</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{totalMessages}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-card to-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/55">
                {selectedThread ? 'In this stream' : 'Select a stream'}
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {selectedThread ? uniqueChatters : '—'}
              </p>
              <p className="text-[11px] text-foreground/50">unique names</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm lg:grid lg:grid-cols-[minmax(280px,340px)_1fr] lg:min-h-[min(720px,calc(100vh-14rem))]">
        <aside className="flex flex-col border-b border-border/60 bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b border-border/60 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Stream threads
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Refresh threads"
                disabled={isLoadingThreads}
                onClick={() => void refreshThreads()}
              >
                {isLoadingThreads ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
              <input
                type="search"
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder="Search streams…"
                className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isLoadingThreads && threads.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : threads.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-foreground/60">No chat threads yet.</p>
            ) : filteredThreads.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-foreground/60">No streams match your search.</p>
            ) : (
              <ul className="space-y-2">
                {filteredThreads.map((thread) => {
                  const selected = selectedVideoId === thread.videoId;
                  const title = displayThreadTitle(thread);
                  return (
                    <li key={thread.videoId}>
                      <button
                        type="button"
                        onClick={() => handleSelectThread(thread.videoId)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? 'border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/20'
                            : 'border-transparent bg-background/80 hover:border-border/60 hover:bg-background'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              thread.videoId === 'legacy'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : 'bg-primary/12 text-primary'
                            }`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                              {title}
                            </p>
                            {thread.videoId !== 'legacy' &&
                            thread.videoTitle?.trim() &&
                            thread.videoTitle.trim() !== thread.videoId ? (
                              <p className="mt-0.5 truncate font-mono text-[10px] text-foreground/45">
                                {thread.videoId}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-foreground/70">
                                {thread.messageCount} msgs
                              </span>
                              <span className="text-[10px] text-foreground/50">
                                {relativeLastActive(thread.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-[420px] flex-col bg-background lg:min-h-0">
          {!selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <MessagesSquare className="h-8 w-8 text-primary/70" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Pick a livestream thread</p>
                <p className="mt-1 max-w-sm text-sm text-foreground/60">
                  Choose a stream on the left to browse the full conversation archive and moderate messages.
                </p>
              </div>
              <Link href="/livestream">
                <Button type="button" variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open public livestream
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <header className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_55%),linear-gradient(to_bottom,hsl(var(--muted)/0.5),transparent)] px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80">
                      Conversation
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-foreground">
                      {displayThreadTitle(selectedThread)}
                    </h2>
                    <p className="mt-1 text-xs text-foreground/55">
                      {messages.length} messages · last activity{' '}
                      {relativeLastActive(selectedThread.lastMessageAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {selectedThread.videoId !== 'legacy' ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${selectedThread.videoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                      >
                        <Button type="button" variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          YouTube
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="relative mt-4 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
                  <input
                    type="search"
                    value={messageSearch}
                    onChange={(event) => setMessageSearch(event.target.value)}
                    placeholder="Search in this conversation…"
                    className="w-full rounded-xl border border-border/60 bg-background/90 py-2 pl-10 pr-3 text-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </header>

              <div className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,hsl(var(--muted)/0.25)_0%,transparent_120px)]">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <p className="px-6 py-16 text-center text-sm text-foreground/60">
                    {messageSearch.trim()
                      ? 'No messages match your search.'
                      : 'No messages in this thread yet.'}
                  </p>
                ) : (
                  <div className="h-full max-h-[min(560px,calc(100vh-20rem))] overflow-y-auto px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-3xl space-y-6">
                      {messageGroups.map((group) => (
                        <div key={group.key}>
                          <div className="mb-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border/70" />
                            <span className="shrink-0 rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                              {group.label}
                            </span>
                            <div className="h-px flex-1 bg-border/70" />
                          </div>
                          <ul className="space-y-4">
                            {group.items.map((message) => {
                              const hue = avatarHue(message.username);
                              return (
                                <li
                                  key={message.id}
                                  className="group flex gap-3 sm:gap-4"
                                >
                                  <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                                    style={{
                                      background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 50% 38%))`,
                                    }}
                                    aria-hidden
                                  >
                                    {initialsFromName(message.username)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="truncate text-sm font-semibold text-foreground">
                                        {message.username}
                                      </span>
                                      <time
                                        className="shrink-0 text-[10px] tabular-nums text-foreground/45"
                                        dateTime={message.createdAt}
                                      >
                                        {formatTimeOnly(message.createdAt)}
                                      </time>
                                    </div>
                                    <div className="relative mt-1.5 inline-block max-w-full rounded-2xl rounded-tl-md border border-border/40 bg-muted/50 px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
                                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                    </div>
                                    <p className="mt-1 hidden text-[10px] text-foreground/40 sm:block">
                                      {formatDateTime(message.createdAt)}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 shrink-0 text-destructive opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                                    aria-label={`Delete message from ${message.username}`}
                                    disabled={deletingId === message.id}
                                    onClick={() => requestDeleteMessage(message)}
                                  >
                                    {deletingId === message.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
