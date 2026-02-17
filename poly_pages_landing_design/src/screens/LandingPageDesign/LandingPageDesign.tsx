import { FeaturesSection } from "./sections/FeaturesSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { WhyChooseUsSection } from "./sections/WhyChooseUsSection";

export const LandingPageDesign = (): JSX.Element => {
  return (
    <div
      className="flex flex-col items-start relative bg-[#faf9f7] w-full min-h-screen"
      data-model-id="2039:979"
    >
      <HeaderSection />
      <HeroSection />
      <HowItWorksSection />
      <WhyChooseUsSection />
      <FeaturesSection />
      <FooterSection />
    </div>
  );
};
