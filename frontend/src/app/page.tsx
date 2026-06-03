import { Header } from "@/components/layout/header";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { MarqueeLogos } from "@/components/home/marquee-logos";
import { CategoriesCarousel } from "@/components/home/categories-carousel";
import { TestimonialsSection } from "@/components/home/testimonials-section";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <BannerCarousel />
        <MarqueeLogos />
        <CategoriesCarousel />
        <TestimonialsSection />
      </main>
    </>
  );
}
