'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
// type LeadershipMember = {
//   name: string;
//   position: string;
//   image: string;
//   description?: string;
// };


type LeadershipMember = {
  name: string;
  position: string;
  image: string;
  description?: string;
};

type LeadershipApiMember = {
  id: string;
  designation: string;
  description?: string | null;
  imageLinkPath?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
};
// const churchAdministration: LeadershipMember[] = [
//   {
//     name: 'Name to be added',
//     position: 'Church Administration Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Leadership profile information can be added here.',
//   },
//   {
//     name: 'Name to be added',
//     position: 'Church Administration Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Leadership profile information can be added here.',
//   },
//   {
//     name: 'Name to be added',
//     position: 'Church Administration Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Leadership profile information can be added here.',
//   },
//   {
//     name: 'Name to be added',
//     position: 'Church Administration Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Leadership profile information can be added here.',
//   },
// ];

// const churchSecretariat: LeadershipMember[] = [
//   {
//     name: 'Name to be added',
//     position: 'Secretariat Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Official church secretariat and administrative responsibilities.',
//   },
//   {
//     name: 'Name to be added',
//     position: 'Secretariat Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Official church secretariat and administrative responsibilities.',
//   },
//   {
//     name: 'Name to be added',
//     position: 'Secretariat Position',
//     image: '/leadership/placeholder.jpg',
//     description:
//       'Official church secretariat and administrative responsibilities.',
//   },
// ];

export default function LeadershipPage() {
  const [activeTab, setActiveTab] = useState<
    'administration' | 'secretariat'
  >('administration');

  const [churchAdministration, setChurchAdministration] = useState<
    LeadershipMember[]
  >([]);

  const [churchSecretariat, setChurchSecretariat] = useState<
    LeadershipMember[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadership = async () => {
      try {
        setLoading(true);
        setError(null);

        const [adminsResponse, secretariatResponse] = await Promise.all([
  apiFetch('/api/church-admins'),
  apiFetch('/api/secretariates'),
]);

        if (!adminsResponse.ok || !secretariatResponse.ok) {
          throw new Error('Failed to fetch church leadership data');
        }

        const admins: LeadershipApiMember[] =
          await adminsResponse.json();

        const secretariates: LeadershipApiMember[] =
          await secretariatResponse.json();

        setChurchAdministration(
          admins.map((admin) => ({
            name: admin.user.name,
            position: admin.designation,
            image: admin.imageLinkPath
              ? `/${admin.imageLinkPath}`
              : '/leadership/placeholder.jpg',
            description:
              admin.description ||
              'Church administration and leadership responsibilities.',
          }))
        );

        setChurchSecretariat(
          secretariates.map((secretariate) => ({
            name: secretariate.user.name,
            position: secretariate.designation,
            image: secretariate.imageLinkPath
              ? `/${secretariate.imageLinkPath}`
              : '/leadership/placeholder.jpg',
            description:
              secretariate.description ||
              'Official church secretariat and administrative responsibilities.',
          }))
        );
      } catch (err) {
        console.error('Failed to load church leadership:', err);
        setError('Unable to load church leadership information.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadership();
  }, []);

  const members =
    activeTab === 'administration'
      ? churchAdministration
      : churchSecretariat;

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-background">

        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('/about/header.JPG')",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/40" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-24 md:mt-32">

              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  Home
                </Link>

                <span className="text-white/50">/</span>

                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>

                <span className="text-white/50">/</span>

                <span>Leadership</span>
              </div>

              <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-4">
                Our Leadership
              </p>

              <h1 className="text-4xl md:text-6xl font-semibold mb-6">
                Church Leadership
              </h1>

              <p className="text-white/80 text-base md:text-lg max-w-2xl leading-relaxed">
                Meet the people entrusted with providing spiritual,
                administrative and operational leadership across the
                church.
              </p>
            </div>
          </div>
        </section>


        {/* Introduction */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                Leadership & Governance
              </p>

              <h2 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
                Serving the church with
                <span className="text-secondary"> purpose.</span>
              </h2>

              <p className="mt-5 text-foreground/70 leading-relaxed text-base md:text-lg">
                The work of the church is supported through distinct
                leadership and administrative structures. These structures
                help provide effective oversight of ministry, church
                administration and official organisational activities.
              </p>
            </div>


            {/* Tabs */}
            <div className="mt-12">
              <div className="inline-flex flex-col sm:flex-row rounded-2xl sm:rounded-full bg-muted/50 p-1.5 border border-border/60">

                <button
                  type="button"
                  onClick={() => setActiveTab('administration')}
                  className={`px-6 py-3 rounded-xl sm:rounded-full text-sm font-semibold transition-all ${activeTab === 'administration'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background'
                    }`}
                >
                  Church Administration
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('secretariat')}
                  className={`px-6 py-3 rounded-xl sm:rounded-full text-sm font-semibold transition-all ${activeTab === 'secretariat'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background'
                    }`}
                >
                  Church Secretariat
                </button>

              </div>
            </div>

          </div>
        </section>


        {/* Leadership Section */}
        <section className="pb-20 md:pb-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Heading */}
            <div className="mb-10 md:mb-14">

              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                {activeTab === 'administration'
                  ? 'Church Administration'
                  : 'Church Secretariat'}
              </p>

              <h2 className="text-3xl md:text-5xl font-semibold text-foreground">
                {activeTab === 'administration'
                  ? 'Church Administration'
                  : 'Church Secretariat'}
              </h2>

              <p className="mt-4 text-foreground/65 max-w-2xl leading-relaxed">
                {activeTab === 'administration'
                  ? 'Leadership responsible for the governance, ministry direction and administration of the church.'
                  : 'Leadership responsible for official church secretariat and organisational administrative activities.'}
              </p>

            </div>


            {/* Leadership Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

              {members.map((member, index) => (
                <article
                  key={`${member.name}-${index}`}
                  className="group overflow-hidden rounded-[28px] border border-border/60 bg-background shadow-sm hover:shadow-xl transition-all duration-300"
                >

                  {/* Image */}
                  <div className="relative aspect-[4/4.5] overflow-hidden bg-muted">



                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>


                  {/* Details */}
                  <div className="p-6">

                    <p className="text-xs uppercase tracking-[0.25em] text-primary/70 mb-2">
                      {member.position}
                    </p>

                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      {member.name}
                    </h3>

                    {member.description && (
                      <p className="mt-3 text-sm text-foreground/65 leading-relaxed">
                        {member.description}
                      </p>
                    )}

                  </div>

                </article>
              ))}

            </div>

          </div>
        </section>


        {/* Closing Section */}
        <section className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/70 mb-4">
              Pentecost International Christian Centre
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold">
              Serving God. Serving His people.
            </h2>

            <p className="mt-5 max-w-2xl mx-auto text-primary-foreground/80 leading-relaxed">
              Our leadership structures exist to support the mission,
              ministry and effective administration of the church.
            </p>

          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}