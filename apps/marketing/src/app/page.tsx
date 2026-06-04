import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InfoCards } from "@/components/InfoCards";
import { StarterKit } from "@/components/StarterKit";
import { Examples } from "@/components/Examples";
import { LanguageSection } from "@/components/LanguageSection";
import { TrustBanner } from "@/components/TrustBanner";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <InfoCards />
        <StarterKit />
        <Examples />
        <LanguageSection />
        <TrustBanner />
      </main>
      <Footer />
    </>
  );
}
