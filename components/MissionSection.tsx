// components/MissionSection.tsx

import Link from 'next/link';
import Image from 'next/image';

export default function MissionSection() {
  return (
    <section className="py-20 md:py-28 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Grayscale image of pastor preaching */}
          <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/pastor-preaching-bw.jpg"  // ← Add your actual photo here (upload to public/images/)
              alt="Our Pastor / Founder Preaching the Gospel"
              fill
              className="object-cover contrast-125"  // grayscale + slight contrast for impact
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Right: Mission text */}
          <div className="space-y-6 md:space-y-8 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight tracking-tight">
              OUR MISSION
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/80">
            The mandate of the Pentecost International Christian Center (PICC) is derived from Genesis 2:10, which says, "Now a river went out of Eden to water the garden, and from there it parted and became four riverheads." 
            Thus PICC is a river operating in the power of the Holy Spirit to water multitudes with the gospel of life and hope in all the four corners of the earth. In this regard, its core mandate is to bring hope to the 
            hopeless and life to the dying and help them become true deciples of Jesus Christ.
            </p>

            <div className="pt-4 md:pt-6">
              <Link href="/about">
                <button className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
                  Learn More About Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
