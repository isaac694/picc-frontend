import Link from 'next/link';
import type { PortalConfig } from '@/lib/hr-portal';

type CareerApplyButtonProps = {
  vacancyIdOrSlug: string;
  title: string;
  className?: string;
  portalConfig?: PortalConfig | null;
};

export default function CareerApplyButton({ vacancyIdOrSlug, className }: CareerApplyButtonProps) {
  return (
    <Link href={`/careers/apply/${vacancyIdOrSlug}`} className={className}>
      Apply
    </Link>
  );
}
