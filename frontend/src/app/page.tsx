import { Header } from "@/components/layout/header";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { MarqueeLogos } from "@/components/home/marquee-logos";
import { TestimonialsSection } from "@/components/home/testimonials-section";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <BannerCarousel />
        <MarqueeLogos />
        <TestimonialsSection />
      </main>
    </>
  );
}
