import { useEffect, useRef, useState } from "react";

export const FeaturesSection = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="flex flex-col gap-6 md:gap-8 bg-white w-full px-4 md:px-8 py-16 md:py-24"
    >
      <img
        className={`w-16 h-16 md:w-20 md:h-20 mx-auto transition-all duration-700 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-75"
        }`}
        alt="Campus collaboration icon"
        src="https://c.animaapp.com/vYVdVbUl/img/container-7.svg"
      />

      <div className="w-full flex justify-center">
        <h2
          className={`max-w-3xl [font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 px-4 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Built for campus collaboration
        </h2>
      </div>

      <div className="w-full flex justify-center">
        <p
          className={`max-w-2xl [font-family:'Inter',Helvetica] font-normal text-[#666666] text-base md:text-xl text-center tracking-[0] leading-relaxed md:leading-[34px] px-4 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Join a growing community of students helping each other succeed. Share
          knowledge, support peers, and achieve more together.
        </p>
      </div>
    </section>
  );
};
