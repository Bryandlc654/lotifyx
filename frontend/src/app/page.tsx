import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { MarqueeLogos } from "@/components/home/marquee-logos";
import { CategoriesCarousel } from "@/components/home/categories-carousel";
import { PromoBanners } from "@/components/home/promo-banners";
import { FeaturesSection } from "@/components/home/features-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { HowToBuySection } from "@/components/home/how-to-buy-section";
import { HowToSellSection } from "@/components/home/how-to-sell-section";
import { BackingSection } from "@/components/home/backing-section";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <BannerCarousel />
        <MarqueeLogos />
        <CategoriesCarousel />
        <PromoBanners />
        <FeaturesSection />
        <TestimonialsSection />
        <HowToBuySection />
        <HowToSellSection />
        <BackingSection />
        <Footer />
      </main>
    </>
  );
}
