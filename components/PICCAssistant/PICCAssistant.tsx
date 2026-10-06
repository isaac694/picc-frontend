'use client';

import { FormEvent, useState } from 'react';
import {
  Bot,
  Mail,
  Phone,
  MessageCircle,
  X,
} from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function PICCAssistant() {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! 👋 I'm the PICC Assistant. How can I help you today?",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Replace these with the official PICC details
  const email = 'info@piccworldwide.org';
  const phone = '+265884748498';
  const whatsapp = '265884748498';

  const openChat = () => {
    setChatOpen(true);
    setOpen(false);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userMessage = message.trim();

    if (!userMessage || isLoading) {
      return;
    }

    // Add user's message immediately
    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: userMessage,
      },
    ]);

    // Clear input
    setMessage('');

    // Show loading state
    setIsLoading(true);

    try {
      const response = await fetch('/api/picc-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Something went wrong.'
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            data.answer ||
            'Sorry, I could not generate a response.',
        },
      ]);
    } catch (error) {
      console.error('PICC Assistant error:', error);

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Sorry, I am having trouble connecting right now. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <>
      {/* =====================================================
          AI CHAT WINDOW
      ===================================================== */}
      {chatOpen && (
        <div
          className="
            fixed bottom-24 right-5 z-[9999]
            flex h-[500px]
            w-[min(380px,calc(100vw-2rem))]
            flex-col
            overflow-hidden
            rounded-2xl
            border border-gray-200
            bg-white
            shadow-2xl
            dark:border-gray-700
            dark:bg-gray-900
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-4 text-white">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Bot size={21} />
              </div>

              <div>
                <p className="font-semibold">
                  PICC Assistant
                </p>

                <p className="text-xs text-white/80">
                  AI Website Assistant
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* CHAT MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">

              {messages.map((chatMessage, index) => (
                <div
                  key={`${chatMessage.role}-${index}`}
                  className={
                    chatMessage.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }
                >
                  <div
                    className={
                      chatMessage.role === 'user'
                        ? `
                          max-w-[85%]
                          rounded-2xl
                          rounded-tr-sm
                          bg-blue-600
                          px-4
                          py-3
                          text-sm
                          text-white
                        `
                        : `
                          max-w-[85%]
                          rounded-2xl
                          rounded-tl-sm
                          bg-gray-100
                          px-4
                          py-3
                          text-sm
                          text-gray-800
                          dark:bg-gray-800
                          dark:text-gray-100
                        `
                    }
                  >
                    {chatMessage.content}
                  </div>
                </div>
              ))}

              {/* LOADING */}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="
                      rounded-2xl
                      rounded-tl-sm
                      bg-gray-100
                      px-4
                      py-3
                      dark:bg-gray-800
                    "
                  >
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* SUGGESTED QUESTIONS */}
            {messages.length === 1 && !isLoading && (
              <div className="mt-5">

                <p className="mb-2 text-xs font-medium text-gray-500">
                  You can ask:
                </p>

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      askQuestion('What is PICC?')
                    }
                    className="
                      rounded-full
                      border
                      px-3
                      py-2
                      text-xs
                      hover:bg-blue-50
                      hover:text-blue-600
                    "
                  >
                    What is PICC?
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      askQuestion(
                        'What programs and services does PICC offer?'
                      )
                    }
                    className="
                      rounded-full
                      border
                      px-3
                      py-2
                      text-xs
                      hover:bg-blue-50
                      hover:text-blue-600
                    "
                  >
                    Programs
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      askQuestion(
                        'Tell me about admissions at PICC.'
                      )
                    }
                    className="
                      rounded-full
                      border
                      px-3
                      py-2
                      text-xs
                      hover:bg-blue-50
                      hover:text-blue-600
                    "
                  >
                    Admissions
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      askQuestion(
                        'How can I contact PICC?'
                      )
                    }
                    className="
                      rounded-full
                      border
                      px-3
                      py-2
                      text-xs
                      hover:bg-blue-50
                      hover:text-blue-600
                    "
                  >
                    Contact PICC
                  </button>

                </div>
              </div>
            )}

          </div>

          {/* INPUT */}
          <div className="border-t p-3 dark:border-gray-700">

            <form
              onSubmit={sendMessage}
              className="flex gap-2"
            >

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Ask PICC Assistant..."
                disabled={isLoading}
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  px-3
                  py-2
                  text-sm
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-gray-700
                  dark:bg-gray-800
                "
              />

              <button
                type="submit"
                disabled={
                  isLoading || !message.trim()
                }
                className="
                  rounded-xl
                  bg-blue-600
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isLoading ? '...' : 'Send'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* =====================================================
          FLOATING ACTION BUTTONS
      ===================================================== */}

      <div
        className="
          fixed
          bottom-5
          right-5
          z-[10000]
          flex
          flex-col
          items-center
          gap-3
        "
      >

        {/* CHAT */}
        <div
          className={`
            transition-all
            duration-300
            ${
              open
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-5 opacity-0'
            }
          `}
        >
          <button
            type="button"
            onClick={openChat}
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-blue-600
              text-white
              shadow-lg
              transition
              hover:scale-110
              hover:bg-blue-700
            "
            aria-label="Chat with PICC"
            title="Chat with PICC"
          >
            <MessageCircle size={22} />
          </button>
        </div>

        {/* EMAIL */}
        <div
          className={`
            transition-all
            duration-300
            delay-75
            ${
              open
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-5 opacity-0'
            }
          `}
        >
          <a
            href={`mailto:${email}`}
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-red-500
              text-white
              shadow-lg
              transition
              hover:scale-110
              hover:bg-red-600
            "
            aria-label="Email PICC"
            title="Email PICC"
          >
            <Mail size={21} />
          </a>
        </div>

        {/* CONTACT */}
        <div
          className={`
            transition-all
            duration-300
            delay-100
            ${
              open
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-5 opacity-0'
            }
          `}
        >
          <a
            href={`tel:${phone}`}
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-green-500
              text-white
              shadow-lg
              transition
              hover:scale-110
              hover:bg-green-600
            "
            aria-label="Contact PICC"
            title="Contact PICC"
          >
            <Phone size={21} />
          </a>
        </div>

        {/* WHATSAPP */}
        <div
          className={`
            transition-all
            duration-300
            delay-150
            ${
              open
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-5 opacity-0'
            }
          `}
        >
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-[#25D366]
              text-white
              shadow-lg
              transition
              hover:scale-110
              hover:bg-[#20bd5a]
            "
            aria-label="WhatsApp PICC"
            title="WhatsApp PICC"
          >
            <MessageCircle size={22} />
          </a>
        </div>

        {/* MAIN BUTTON / CLOSE */}
        <button
          type="button"
          onClick={() =>
            setOpen((previous) => !previous)
          }
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-blue-600
            text-white
            shadow-xl
            transition-all
            duration-200
            hover:scale-110
            hover:bg-blue-700
            focus:outline-none
            focus:ring-4
            focus:ring-blue-300
          "
          aria-label={
            open
              ? 'Close PICC Assistant'
              : 'Open PICC Assistant'
          }
        >
          {open ? (
            <X size={26} />
          ) : (
            <Bot size={27} />
          )}
        </button>

      </div>
    </>
  );
}