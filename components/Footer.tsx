import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">About Us</h3>
            <p className="text-sm text-primary-foreground/80">
              <ul className="space-y-2 text-sm">  
                <li><Link href="/about" className="hover:underline">Mandate</Link></li>
                <li><Link href="/about" className="hover:underline">Core Values</Link></li>
                <li><Link href="/about" className="hover:underline">Tenets of faith</Link></li>
                <li><Link href="/about" className="hover:underline">Join Us</Link></li>
              </ul>

            </p>
          </div>

          {/* Quick Links */}
          {/* <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/about" className="hover:underline">About</Link></li>
              <li><Link href="/services" className="hover:underline">Services</Link></li>
              <li><Link href="/sermons" className="hover:underline">Sermons</Link></li>
              <li><Link href="/events" className="hover:underline">Events</Link></li>
            </ul>
          </div> */}

          {/* Service Times */}
          <div>
            <h3 className="font-bold text-lg mb-4">Service Times</h3>
            <ul className="space-y-2 text-sm">
              <li>Sunday: 10:00 AM</li>
              <li>Wednesday: 7:00 PM</li>
              <li>Friday: 6:00 PM</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
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
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
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
