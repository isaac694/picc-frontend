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
    items-end
    gap-3
  "
>


  {/* CHAT */}
  <div
    className={`
      group
      flex
      items-center
      gap-3
      transition-all
      duration-300
      ${
        open
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-5 opacity-0'
      }
    `}
  >

    <span
      className="
        rounded-lg
        bg-white
        px-4
        py-2
        text-sm
        text-gray-700
        shadow-md
        opacity-0
        translate-x-3
        transition-all
        duration-300
        group-hover:opacity-100
        group-hover:translate-x-0
      "
    >
      Chat with PICC
    </span>


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
      "
    >
      <MessageCircle size={22}/>
    </button>

  </div>




  {/* EMAIL */}
  <div
    className={`
      group
      flex
      items-center
      gap-3
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

    <span
      className="
        rounded-lg
        bg-white
        px-4
        py-2
        text-sm
        text-gray-700
        shadow-md
        opacity-0
        translate-x-3
        transition-all
        duration-300
        group-hover:opacity-100
        group-hover:translate-x-0
      "
    >
      Email PICC
    </span>


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
      "
    >
      <Mail size={21}/>
    </a>

  </div>




  {/* CONTACT */}
  <div
    className={`
      group
      flex
      items-center
      gap-3
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

    <span
      className="
        rounded-lg
        bg-white
        px-4
        py-2
        text-sm
        text-gray-700
        shadow-md
        opacity-0
        translate-x-3
        transition-all
        duration-300
        group-hover:opacity-100
        group-hover:translate-x-0
      "
    >
      Contact PICC
    </span>


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
      "
    >
      <Phone size={21}/>
    </a>

  </div>




  {/* WHATSAPP */}
  {/* WHATSAPP */}
<div
  className={`
    group
    relative
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

  {/* LABEL ON HOVER */}
  <span
    className="
      absolute
      right-16
      top-1/2
      -translate-y-1/2
      whitespace-nowrap
      rounded-lg
      bg-white
      px-4
      py-2
      text-sm
      font-medium
      text-gray-700
      shadow-md
      opacity-0
      transition-all
      duration-200
      group-hover:opacity-100
      dark:bg-gray-800
      dark:text-white
    "
  >
    WhatsApp PICC
  </span>


  <a
    href={`https://wa.me/${whatsapp}`}
    target="_blank"
    rel="noopener noreferrer"
    className="
      flex
      h-14
      w-14
      items-center
      justify-center
      rounded-full
      bg-[#00A884]
      text-white
      shadow-xl
      transition-all
      duration-200
      hover:scale-110
      hover:bg-[#008f72]
    "
    aria-label="WhatsApp PICC"
  >

    {/* WhatsApp style icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className="h-8 w-8 fill-white"
    >
      <path
        d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.55 1.74 6.54L3 29l6.67-1.7A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5c-2.02 0-4-.54-5.72-1.57l-.41-.24-3.96 1.01 1.05-3.84-.27-.43A10.5 10.5 0 1 1 16 26.5zm5.8-7.9c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.52-.16-.74.16-.22.32-.85 1.05-1.04 1.27-.19.22-.38.24-.7.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.77-2.2-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.22-.32.32-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.02-2.44-.27-.65-.55-.56-.74-.57h-.63c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.22 2.3 3.51 5.58 4.92.78.34 1.39.54 1.87.69.79.25 1.51.21 2.08.13.63-.09 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.62-.38z"
      />
    </svg>

  </a>

</div>




  {/* MAIN BUTTON */}
  {/* MAIN CHAT BUBBLE BUTTON */}

{/* MAIN CHAT BUTTON */}

<button
  type="button"
  onClick={() =>
    setOpen((previous) => !previous)
  }
  className="
    group
    relative
    flex
    h-16
    w-16
    items-center
    justify-center
    rounded-2xl
    bg-gradient-to-br
    from-cyan-400
    to-blue-600
    text-white
    shadow-2xl
    transition-all
    duration-300
    hover:scale-110
    focus:outline-none
  "
  aria-label="Open PICC Assistant"
>

  {open ? (
    <X size={28} />
  ) : (
    <div className="flex gap-1">

      <span className="
        h-2.5
        w-2.5
        rounded-full
        bg-white
      " />

      <span className="
        h-2.5
        w-2.5
        rounded-full
        bg-white
      " />

      <span className="
        h-2.5
        w-2.5
        rounded-full
        bg-white
      " />

    </div>
  )}


  {/* CHAT BUBBLE POINTER */}

  {!open && (
    <span
      className="
        absolute
        -bottom-3
        left-6
        h-5
        w-5
        rotate-45
        bg-gradient-to-br
        from-cyan-400
        to-blue-600
      "
    />
  )}

</button>
</div>   </>
  );
}