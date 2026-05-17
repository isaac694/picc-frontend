'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMinistriesOpen, setMobileMinistriesOpen] = useState(false);
  const [mobileSchoolsOpen, setMobileSchoolsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const pathname = usePathname();
  const isDarkNav = pathname?.startsWith('/livestream');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/livestream', label: 'Livestream' },
    { href: '/store', label: 'Store' },
    { href: '/contact', label: 'Contact' },
  ];
  const ministryLinks = [
    { href: '/ministries/icd', label: 'ICD' },
    { href: '/ministries/men-of-valour', label: 'Men of Valour' },
    { href: '/ministries/prison-ministry', label: 'Prison Ministry' },
    { href: '/ministries/youth-church-ministry', label: 'Youth Church Ministry' },
    { href: '/ministries/women-of-hope', label: 'Women of Hope' },
    { href: '/ministries/wailing-woman', label: 'Wailing Woman' },
    { href: '/ministries/rivers-of-hope', label: 'Rivers of Hope' },
    { href: '/ministries/heritage', label: 'Heritage Ministry' },

  ];
  const schoolLinks = [
    { href: '/schools/picc-secondary', label: 'PICC Secondary School' },
    { href: '/schools/hope-school', label: 'Hope School of Ministry' },
    { href: '/schools/discipleship', label: 'School of Discipleship' },
  ];

  const handleToggleMenu = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setMobileMinistriesOpen(false);
        setMobileSchoolsOpen(false);
        setMobileResourcesOpen(false);
      }
      return next;
    });
  };
  const closeMenu = () => {
    setIsOpen(false);
    setMobileMinistriesOpen(false);
    setMobileSchoolsOpen(false);
    setMobileResourcesOpen(false);
  };

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
            <span className="text-sm md:text-base leading-tight hidden sm:inline">
              Welcome to PICC
            </span>
            <span className="text-sm leading-tight sm:hidden">
              PICC
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
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

            {/* Desktop Ministries Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className={
                  isDarkNav
                    ? 'text-white/80 hover:text-white transition-colors text-sm font-medium'
                    : 'text-foreground hover:text-primary transition-colors text-sm font-medium'
                }
              >
                Ministry & Outreach
              </button>
              <div
                className={
                  isDarkNav
                    ? 'absolute left-0 top-full mt-3 w-56 rounded-lg border border-white/10 bg-black/95 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                    : 'absolute left-0 top-full mt-3 w-56 rounded-lg border border-border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                }
              >
                <div className="py-2">
                  {ministryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                          : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Schools Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className={
                  isDarkNav
                    ? 'text-white/80 hover:text-white transition-colors text-sm font-medium'
                    : 'text-foreground hover:text-primary transition-colors text-sm font-medium'
                }
              >
                Schools
              </button>
              <div
                className={
                  isDarkNav
                    ? 'absolute left-0 top-full mt-3 w-64 rounded-lg border border-white/10 bg-black/95 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                    : 'absolute left-0 top-full mt-3 w-64 rounded-lg border border-border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all'
                }
              >
                <div className="py-2">
                  {schoolLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                          : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Resources Dropdown */}
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
                    href="/media"
                    className={
                      isDarkNav
                        ? 'block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10'
                        : 'block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted'
                    }
                  >
                    Media
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
            className={isDarkNav ? 'lg:hidden text-white' : 'lg:hidden'}
            onClick={handleToggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/40"
              onClick={closeMenu}
            />
            <div
              className={
                isDarkNav
                  ? 'relative z-50 pb-4 space-y-2 bg-black'
                  : 'relative z-50 pb-4 space-y-2 bg-background'
              }
            >
              <div className="flex items-center justify-end px-4 pt-3">
                <button
                  type="button"
                  aria-label="Close menu"
                  className={
                    isDarkNav
                      ? 'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10'
                      : 'inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted'
                  }
                  onClick={closeMenu}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isDarkNav
                      ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                      : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                  }
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Ministries Dropdown */}
              <div>
                <button
                  type="button"
                  className={
                    isDarkNav
                      ? 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-white/80 text-xs uppercase tracking-[0.2em]'
                      : 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-foreground/60 text-xs uppercase tracking-[0.2em]'
                  }
                  onClick={() => setMobileMinistriesOpen((prev) => !prev)}
                  aria-expanded={mobileMinistriesOpen}
                >
                  <span>Ministries</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${mobileMinistriesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileMinistriesOpen && (
                  <div className="space-y-1">
                    {ministryLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={
                          isDarkNav
                            ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                            : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                        }
                        onClick={closeMenu}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Schools Dropdown */}
              <div>
                <button
                  type="button"
                  className={
                    isDarkNav
                      ? 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-white/80 text-xs uppercase tracking-[0.2em]'
                      : 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-foreground/60 text-xs uppercase tracking-[0.2em]'
                  }
                  onClick={() => setMobileSchoolsOpen((prev) => !prev)}
                  aria-expanded={mobileSchoolsOpen}
                >
                  <span>Schools</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${mobileSchoolsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileSchoolsOpen && (
                  <div className="space-y-1">
                    {schoolLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={
                          isDarkNav
                            ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                            : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                        }
                        onClick={closeMenu}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Resources Dropdown */}
              <div>
                <button
                  type="button"
                  className={
                    isDarkNav
                      ? 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-white/80 text-xs uppercase tracking-[0.2em]'
                      : 'w-full flex items-center justify-between px-4 pt-3 pb-2 text-foreground/60 text-xs uppercase tracking-[0.2em]'
                  }
                  onClick={() => setMobileResourcesOpen((prev) => !prev)}
                  aria-expanded={mobileResourcesOpen}
                >
                  <span>Resources</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${mobileResourcesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileResourcesOpen && (
                  <div className="space-y-1">
                    <Link
                      href="/media"
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                          : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                      }
                      onClick={closeMenu}
                    >
                      Media
                    </Link>
                    <Link
                      href="/forms"
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                          : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                      }
                      onClick={closeMenu}
                    >
                      Forms
                    </Link>
                    <Link
                      href="/locations"
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                          : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                      }
                      onClick={closeMenu}
                    >
                      Church Locations
                    </Link>
                    <Link
                      href="/sermons"
                      className={
                        isDarkNav
                          ? 'block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors'
                          : 'block px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors'
                      }
                      onClick={closeMenu}
                    >
                      Sermons
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/give"
                className="block px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
                onClick={closeMenu}
              >
                Give
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}