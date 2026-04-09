import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Music2 } from 'lucide-react';

export default function LivestreamFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-transparent text-white rounded-t-[36px] overflow-hidden">
      <div className="w-full px-0 pt-20 pb-0">
        <div className="w-full rounded-t-[36px] rounded-b-none bg-[#1b2736] px-8 pt-16 pb-6 md:px-12 md:pt-20 md:pb-8 shadow-2xl min-h-[520px]">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.8fr_1fr] gap-10 md:gap-12">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16">
                  <Image src="/logo.png" alt="PICC logo" fill sizes="64px" className="object-contain" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Pentecost International</p>
                  <p className="text-lg font-semibold">Christian Center</p>
                </div>
              </div>
              <p className="text-sm text-white/75 leading-relaxed max-w-sm">
                Welcome to the home of success. Feel free to connect to our live service
                or stream no matter where you are.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/livestream" className="hover:text-white">Livestream</Link></li>
                <li><Link href="/events" className="hover:text-white">Events</Link></li>  
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Malawi, Lilongwe, Area 49 Bahghdad
              </p>
              <div className="mt-6 flex items-center gap-4 text-white/80">
                <Link href="https://www.facebook.com/PICCWorldwide/" aria-label="Facebook" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Facebook size={20} />
                </Link>
                <Link href="https://www.instagram.com/piccworldwide/" aria-label="Instagram" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Instagram size={20} />
                </Link>
                <Link href="https://x.com/PastorEsauBanda" aria-label="Twitter" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Twitter size={20} />
                </Link>
                <Link href="http://youtube.com/@piccworldwide" aria-label="YouTube" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Youtube size={20} />
                </Link>
                <Link href="#" aria-label="TikTok" className="hover:text-white">
                  <Music2 size={20} />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-white/15 text-center text-sm text-white/60">
            &copy; {currentYear} Pentecost International Christian Center. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
