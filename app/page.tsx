import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { Users } from "@/components/landing/Users";

export default function HomePage() {
  return (
    <div className="bg-[#f6f6f8] text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Users />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
