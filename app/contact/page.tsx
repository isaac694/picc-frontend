'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/api';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Thank you for reaching out! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error sending your message. Please try again.');
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-12 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Get in Touch</h1>
            <p className="text-lg text-foreground/70">We&apos;d love to hear from you. Reach out with any questions or concerns.</p>
          </div>
        </section>

        {/* Contact Info & Form Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <Card className="p-6 border-l-4 border-l-secondary">
                    <div className="flex items-start gap-4">
                      <Phone className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-primary mb-1">Phone</h3>
                        <p className="text-foreground/70">+265 992 433 333</p>
                        <p className="text-sm text-foreground/50">Available Monday-Friday, 9 AM - 5 PM</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-primary mb-1">Email</h3>
                        <p className="text-foreground/70">info@piccworldwide.org</p>
                        <p className="text-sm text-foreground/50">We&apos;ll respond within 24 hours</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-primary mb-1">Location</h3>
                        <p className="text-foreground/70">Malawi, Lilongwe</p>
                        <p className="text-foreground/70">Area 49, Baghdad</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <div className="flex items-start gap-4">
                      <Clock className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-primary mb-1">Service Hours</h3>
                        <p className="text-foreground/70">Sunday: 10:00 AM</p>
                        <p className="text-foreground/70">Wednesday: 7:00 PM</p>
                        <p className="text-foreground/70">Friday: 6:00 PM</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Send us a Message</h2>
                <Card className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+265 123 456 799"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your message here..."
                        rows={5}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      ></textarea>
                    </div>

                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Send Message
                    </Button>
                  </form>
                </Card>
              </div>
            </div>

            {/* Map Section (Placeholder) */}
            <div className="rounded-lg overflow-hidden bg-muted h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290255!2d-74.00601672346187!3d40.71282617143175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a21fb011565%3A0x1234567890abcdef!2s123%20Main%20St%2C%20New%20York%2C%20NY%2010001!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

