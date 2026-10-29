import { DemoPage, demoMetadata } from '@/components/Pages';
import type { Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: PageProps<'/[lang]/demo'>) {
  return demoMetadata((await params).lang as Locale);
}

export default async function Demo({ params }: PageProps<'/[lang]/demo'>) {
  return <DemoPage locale={(await params).lang as Locale} />;
}
