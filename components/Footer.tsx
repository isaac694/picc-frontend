import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-[28px] border border-white/10 bg-[#121212] p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>Malawi, Lilongwe, Area 49 Bahghdad</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <a href="tel:+265992433333" className="hover:underline">+265 992 433 333</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={18} />
                  <a href="mailto:info@piccworldwide.org" className="hover:underline">info@piccworldwide.org</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <p className="text-sm text-white/80">
                Malawi, Lilongwe, Area 49 Bahghdad
              </p>
              <div className="mt-6">
                <h4 className="text-sm uppercase tracking-[0.2em] text-white/60 mb-2">Service Times</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>Sunday: 10:00 AM</li>
                  <li>Wednesday: 7:00 PM</li>
                  <li>Friday: 6:00 PM</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Stay Connected</h3>
              <p className="text-sm text-white/70">
                Sign up with your email address to receive updates from Pentecost International Christian Center.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                <Link href="/about" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  About Us
                </Link>
                <Link href="/events" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  Events
                </Link>
                <Link href="/sermons" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  Sermons
                </Link>
                <Link href="/give" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  Give
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-white/60">
            <p>&copy; {currentYear} - Pentecost International Christian Center. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:underline">Privacy Policy</Link>
              <Link href="#" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
