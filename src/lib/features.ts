import { ICONS } from '$lib/icons';
import type { Feature } from '$lib/authorization';

export interface FeatureMeta {
  key: Feature;
  title: string;
  description: string;
  href: string;
  buttonText: string;
  claim: Feature; // claim matches key for now
  icon: keyof typeof ICONS;
  gradientFrom: string;
  gradientTo: string;
  borderClass: string;
  buttonClass: string;
  order: number;
}

export const FEATURES: readonly FeatureMeta[] = [
  {
    key: 'calendarSyncs',
    title: 'Calendar Syncs',
    description: 'Connect and sync your Google Calendar and Microsoft 365 calendars.',
    href: '/calendar-syncs',
    buttonText: 'Manage Syncs',
    claim: 'calendarSyncs',
    icon: 'calendar',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-50',
    borderClass: 'border-blue-100',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    order: 1
  },
  {
    key: 'events',
    title: 'Events',
    description: 'Create, edit, and manage your events across multiple calendars.',
    href: '/events',
    buttonText: 'Manage Events',
    claim: 'events',
    icon: 'plus',
    gradientFrom: 'from-purple-50',
    gradientTo: 'to-pink-50',
    borderClass: 'border-purple-100',
    buttonClass: 'bg-purple-600 hover:bg-purple-700',
    order: 2
  },
  {
    key: 'campaigns',
    title: 'Campaigns',
    description: 'Create and manage message campaigns to post across your connected calendars.',
    href: '/campaigns',
    buttonText: 'Manage Campaigns',
    claim: 'campaigns',
    icon: 'checkSquare',
    gradientFrom: 'from-green-50',
    gradientTo: 'to-emerald-50',
    borderClass: 'border-emerald-100',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    order: 3
  }
] as const;

export function getVisibleFeatures(user: any, hasAccessFn: (u: any, f: Feature) => boolean): FeatureMeta[] {
  return FEATURES.filter(f => hasAccessFn(user, f.key)).sort((a, b) => a.order - b.order);
}
