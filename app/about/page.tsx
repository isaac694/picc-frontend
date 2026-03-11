import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Our Church</h1>
            <p className="text-lg text-primary-foreground/90">
              A community dedicated to worship, fellowship, and spiritual growth.
            </p>
          </div>
        </section>

        {/* Church Story */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-6">Our Story</h2>
                <p className="text-foreground/70 mb-4 leading-relaxed">
                  Our church was founded on the belief that everyone deserves to experience God&apos;s love and grace in a welcoming, authentic community. What started as a small group of believers gathering to worship has grown into a thriving congregation of hundreds of families.
                </p>
                <p className="text-foreground/70 mb-4 leading-relaxed">
                  For over two decades, we have been committed to biblical teaching, vibrant worship, and compassionate community service. Our mission is to help people discover and follow Jesus Christ in a way that transforms their lives and impacts our world.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  Today, we continue to grow as a church while maintaining our core values of authenticity, inclusivity, and spiritual depth. We believe that church should be a place where everyone can come as they are and experience the healing and hope that only Christ can bring.
                </p>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src="/hero.jpg"
                  alt="Church interior"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">Get Acquianted with Pentecost International Christian Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Target className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Mandate</h3>
                <p className="text-foreground/70">
                  Over the years, our church has been a place of refue and hope for countless individuals seeking meaning and purpose in life
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Core Values</h3>
                <p className="text-foreground/70">
                  To glorify God through passionate worship, loving one another as Christ loves us, and proclaiming the Gospel to all nations.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Tenets of Faith</h3>
                <p className="text-foreground/70">
                  We believe in the Great Commission to go into all the world and make disciples of all nations, baptizing them in the name of the Holy Spirit.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">The Logo</h3>
                <p className="text-foreground/70">
                  At Pentecost International Christian Center, we operate under a structure designed to facilitate spiritual growth and effective ministry.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Leadership Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">Our Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Pastor James Martin', role: 'Senior Pastor', image: '/placeholder-profile.jpg' },
                { name: 'Pastor Sarah Johnson', role: 'Worship Pastor', image: '/placeholder-profile.jpg' },
                { name: 'Pastor Michael Chen', role: 'Community Outreach', image: '/placeholder-profile.jpg' },
              ].map((leader, i) => (
                <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-32 h-32 relative mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-primary mb-1">{leader.name}</h3>
                  <p className="text-foreground/70">{leader.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12">What We Believe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'The Bible',
                  description: 'We believe the Bible is God\'s authoritative word and the foundation for our faith and practice.'
                },
                {
                  title: 'Jesus Christ',
                  description: 'We believe Jesus Christ is the Son of God, our Savior, and Lord who died for our sins and rose again.'
                },
                {
                  title: 'Salvation',
                  description: 'We believe salvation comes through faith in Jesus Christ and His transformative grace.'
                },
                {
                  title: 'The Holy Spirit',
                  description: 'We believe the Holy Spirit empowers believers and guides the church in fulfilling God\'s purpose.'
                },
                {
                  title: 'The Church',
                  description: 'We believe the church is the body of Christ, called to worship God and serve humanity with love.'
                },
                {
                  title: 'Community',
                  description: 'We believe strong Christian community is essential for spiritual growth and living out our faith.'
                },
              ].map((belief, i) => (
                <div key={i} className="border-l-4 border-l-secondary pl-6">
                  <h3 className="font-bold text-lg text-primary mb-2">{belief.title}</h3>
                  <p className="text-foreground/70">{belief.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
