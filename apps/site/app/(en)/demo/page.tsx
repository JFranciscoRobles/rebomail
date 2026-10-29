import { DemoPage, demoMetadata } from '@/components/Pages';

export const metadata = demoMetadata('en');

export default function Demo() {
  return <DemoPage locale="en" />;
}
