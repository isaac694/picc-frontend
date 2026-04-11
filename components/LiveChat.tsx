'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface LiveChatProps {
  videoId: string;
}

export default function LiveChat({ videoId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user info
      fetchUserInfo(token);
    }
  }, []);

  // Fetch messages when user is authenticated or videoId changes
  useEffect(() => {
    if (user && videoId) {
      fetchMessages();
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, videoId]);

  // Auto-scroll within the chat panel when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('authToken');
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !videoId) return;

      const response = await fetch(apiUrl(`/api/chat/messages?videoId=${videoId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        setUser(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !videoId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl('/api/chat/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: newMessage.trim(),
          videoId: videoId
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(); // Refresh messages
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) return;

    setIsAuthLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setIsAuthModalOpen(false);
        setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Login failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.username || !authForm.email || !authForm.password || !authForm.confirmPassword) return;

    if (authForm.password !== authForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: authForm.username,
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setIsAuthModalOpen(false);
        setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Registration failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: 'Registration failed',
        variant: 'destructive',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setMessages([]);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Join the Live Chat</h3>
          <p className="text-white/70 text-sm">
            Connect with fellow believers during the livestream
          </p>
        </div>
        <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-white/90 !text-black">
              Login / Register
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Welcome to PICC Live Chat</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 top-9 inline-flex items-center text-sm text-muted-foreground"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isAuthLoading}>
                    {isAuthLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      type="text"
                      value={authForm.username}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 top-9 inline-flex items-center text-sm text-muted-foreground"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 top-9 inline-flex items-center text-sm text-muted-foreground"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isAuthLoading}>
                    {isAuthLoading ? 'Creating account...' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Chat</h3>
          <p className="text-sm text-white/70">Welcome, {user.name}!</p>
        </div>
<Button
  variant="outline"
  size="sm"
  onClick={handleLogout}
  className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800"
>
  Logout
</Button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            <p>No messages yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{message.username}</span>
                <span className="text-xs text-white/50">{formatTime(message.createdAt)}</span>
              </div>
              <p className="text-white/90 bg-white/5 rounded-lg px-3 py-2 break-words">
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="bg-white text-black hover:bg-white/90"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}
