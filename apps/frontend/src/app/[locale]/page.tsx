import { notFound } from "next/navigation";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { MobileShell } from "@/components/shell/mobile-shell";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);

  return (
    <MobileShell locale={locale} title={dictionary.home.title}>
      <HomeDashboard locale={locale} />
    </MobileShell>
  );
}
