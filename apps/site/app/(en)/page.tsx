import { HomePage, homeMetadata } from '@/components/Pages';

export const metadata = homeMetadata('en');

export default function Home() {
  return <HomePage locale="en" />;
}
