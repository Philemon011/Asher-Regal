import { Hero } from "@/components/home/hero";
import { ImageMarquee } from "@/components/home/image-marquee";
import { HowItWorks } from "@/components/home/how-it-works";
import { SupportSection } from "@/components/home/support-section";

export default function Home() {
  return (
    <>
      <Hero />
      <ImageMarquee />
      <HowItWorks />
      <SupportSection />
    </>
  );
}