// components/MissionSection.tsx

import Link from 'next/link';
import Image from 'next/image';

type MissionSectionProps = {
  imageUrl?: string | null;
};

export default function MissionSection({ imageUrl }: MissionSectionProps) {
  const resolvedImage = imageUrl === undefined ? '/images/pastor-preaching-bw.jpeg' : imageUrl;
  return (
    <section className="py-20 md:py-28 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Grayscale image of pastor preaching */}
          <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
            {resolvedImage ? (
              <Image
                src={resolvedImage}
                alt="Our Pastor / Founder Preaching the Gospel"
                fill
                className="object-cover contrast-125"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-primary/10 text-sm text-foreground/50">
                Image removed
              </div>
            )}
          </div>

          {/* Right: Mission text */}
          <div className="space-y-6 md:space-y-8 text-center md:text-left">
            <p className="text-xs md:text-sm font-semibold tracking-[0.35em] text-foreground/60">
              OUR MISSION
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight tracking-tight">
              To Bring Hope To the Hopeless and Life To the Dying
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-foreground/70 max-w-xl mx-auto md:mx-0">
              The mandate of Pentecost International Christian Center (PICC) is derived from Genesis 2:10, which says &quot;Now a river went
              out of Eden to water the garden, and from there it parted and became four riverheads.&quot; Thus PICC is a river operating in the power of the Holy
              Spirit to water multitudes with the gospel of life and hope in all four corners of the earth. 
            </p>

            <div className="pt-2 md:pt-4">
              <Link href="/about">
                <button className="inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-sm md:text-base font-semibold shadow-md transition-all duration-300">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
