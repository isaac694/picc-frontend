import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Users } from 'lucide-react';

export default function GivePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Support Our Ministry</h1>
            <p className="text-lg text-primary-foreground/90">
              Your generous giving enables us to continue our mission of worship, fellowship, and community service.
            </p>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12">Your Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-2">Local Ministry</h3>
                <p className="text-foreground/70">
                  Your gifts support our worship services, prayer programs, and community outreach initiatives.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-2">Community Care</h3>
                <p className="text-foreground/70">
                  We support families in crisis, community food banks, and various benevolence programs.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <TrendingUp className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-2">Growth & Education</h3>
                <p className="text-foreground/70">
                  We invest in discipleship programs, youth ministries, and spiritual education initiatives.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Giving Options */}
        <section className="py-20 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12">Ways to Give</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Online Giving */}
              <Card className="p-8 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-2xl text-primary mb-4">Online Giving</h3>
                <p className="text-foreground/70 mb-6">
                  Give securely through our online portal. You can set up one-time donations or recurring monthly giving.
                </p>
                <ul className="space-y-2 text-sm text-foreground/70 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Secure payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Recurring giving options
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Automatic tax receipts
                  </li>
                </ul>
                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Give Online
                </Button>
              </Card>

              {/* Other Methods */}
              <Card className="p-8 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-2xl text-primary mb-4">Other Ways to Give</h3>
                <p className="text-foreground/70 mb-6">
                  We also accept gifts through several other methods for your convenience.
                </p>
                <ul className="space-y-3 text-sm text-foreground/70 mb-6">
                  <li>
                    <strong className="text-primary">Check:</strong> Send to 123 Main Street, City, State 12345
                  </li>
                  <li>
                    <strong className="text-primary">Cash:</strong> Offering envelopes available in church
                  </li>
                  <li>
                    <strong className="text-primary">Bank Transfer:</strong> Contact the office for details
                  </li>
                  <li>
                    <strong className="text-primary">Mobile App:</strong> Use our giving app available on iOS and Android
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Is my giving tax-deductible?',
                  a: 'Yes, our church is a 501(c)(3) nonprofit organization. All monetary gifts are tax-deductible. You will receive a tax receipt for your records.'
                },
                {
                  q: 'Can I set up recurring giving?',
                  a: 'Absolutely! You can set up monthly, weekly, or custom giving schedules through our online giving platform or by contacting the church office.'
                },
                {
                  q: 'How is my money used?',
                  a: 'Our finances support worship services, community outreach, youth programs, staff compensation, and building maintenance. Our full annual budget is available upon request.'
                },
                {
                  q: 'Is my giving information private?',
                  a: 'Yes, all giving information is confidential and secure. We never share donor information with third parties.'
                },
              ].map((item, i) => (
                <div key={i} className="border-b border-border pb-6">
                  <h3 className="font-bold text-lg text-primary mb-2">{item.q}</h3>
                  <p className="text-foreground/70">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You for Your Support!</h2>
            <p className="mb-6 text-primary-foreground/90">
              Your generosity makes a real difference in our church and community.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

