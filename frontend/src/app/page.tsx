import { Header } from "@/components/layout/header";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { MarqueeLogos } from "@/components/home/marquee-logos";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <BannerCarousel />
        <MarqueeLogos />
      </main>
    </>
  );
}
