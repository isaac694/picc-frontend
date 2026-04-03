'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isDarkNav = pathname?.startsWith('/livestream');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/forms', label: 'Forms' },
    { href: '/livestream', label: 'Livestream' },
    { href: '/events', label: 'Events' },
    { href: '/store', label: 'Store' },
    { href: '/contact', label: 'Contact' },
    
  ];

  return (
    <nav
      className={
        isDarkNav
          ? 'sticky top-0 z-50 bg-black border-b border-white/10 shadow-sm'
          : 'sticky top-0 z-50 bg-background border-b border-border shadow-sm'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className={
              isDarkNav
                ? 'flex items-center gap-2 font-bold text-xl text-white'
                : 'flex items-center gap-2 font-bold text-xl text-primary'
            }
          >
            <Image
              src="/logo.png"
              alt="Pentecost International Christian Center logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-sm md:text-base leading-tight">
              Welcome to Pentecost International Christian Center
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isDarkNav
                    ? 'text-white/80 hover:text-white transition-colors text-sm font-medium'
                    : 'text-foreground hover:text-primary transition-colors text-sm font-medium'
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="relative group">
              <button
                type="button"
                className={
                  isDarkNav
                    ? 'text-white/80 hover:text-white transition-colors text-sm font-medium'
                    : 'text-foreground hover:text-primary transition-colors text-sm font-medium'
                }
              >
                Resources
              </button>
              <div
                className={
                  isDarkNav
                    ? 'absolute left-0 top-full mt-3 w-48 rounded-lg border border-white/10 bg-black/95 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                    : 'absolute left-0 top-full mt-3 w-48 rounded-lg border border-border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                }
              >
                <div className="py-2">
                  <Link
                    href="/locations"
                    className={
                      isDarkNav
                        ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                        : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                    }
                  >
                    Church Locations
                  </Link>
                                    <Link
                    href="/ministries"
                    className={
                      isDarkNav
                        ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                        : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                    }
                  >
                    Ministries
                  </Link>
                  <Link
                    href="/forms"
                    className={
                      isDarkNav
                        ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                        : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                    }
                  >
                    Forms
                  </Link>
                  <Link
                    href="/sermons"
                    className={
                      isDarkNav
                        ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                        : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                    }
                  >
                    Sermons
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/give"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
            >
              Give
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={isDarkNav ? 'md:hidden text-white' : 'md:hidden'}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            className={
              isDarkNav
                ? 'md:hidden pb-4 space-y-2 bg-black'
                : 'md:hidden pb-4 space-y-2'
            }
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isDarkNav
                    ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                    : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                }
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className={isDarkNav ? 'px-4 pt-2 text-white/60 text-xs uppercase tracking-[0.2em]' : 'px-4 pt-2 text-foreground/60 text-xs uppercase tracking-[0.2em]'}>
              Resources
            </div>
            <Link
              href="/locations"
              className={
                isDarkNav
                  ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                  : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
              }
              onClick={() => setIsOpen(false)}
            >
              Church Locations
            </Link>
                        <Link
              href="/ministries"
              className={
                isDarkNav
                  ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                  : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
              }
              onClick={() => setIsOpen(false)}
            >
              Ministries
            </Link>
            <Link
              href="/forms"
              className={
                isDarkNav
                  ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                  : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
              }
              onClick={() => setIsOpen(false)}
            >
              Forms
            </Link>
            <Link
              href="/sermons"
              className={
                isDarkNav
                  ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                  : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
              }
              onClick={() => setIsOpen(false)}
            >
              Sermons
            </Link>
            <Link
              href="/give"
              className="block px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Give
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
