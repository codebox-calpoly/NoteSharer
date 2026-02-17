import { useEffect, useRef, useState } from "react";

export const HowItWorksSection = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
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

  const steps = [
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container.svg",
      title: "Upload Your Notes",
      description: "Upload your study materials and lecture notes",
    },
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-1.svg",
      title: "Earn Credits",
      description: "Receive credits every time you \nupload.",
    },
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-2.svg",
      title: "Unlock Study Materials",
      description:
        "Use your credits to access notes from students across campus.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="flex flex-col w-full items-start gap-12 md:gap-16 pt-16 md:pt-24 pb-12 md:pb-16 px-4 md:px-8 bg-white"
    >
      <header className="relative w-full">
        <h2
          className={`[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          How Poly Pages Works
        </h2>
      </header>

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <article
              key={index}
              className={`flex flex-col items-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              <img
                className="w-[88px] h-[88px] mb-6 transition-transform duration-300 hover:scale-110"
                alt={step.title}
                src={step.icon}
              />

              <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-xl md:text-2xl text-center tracking-[0] leading-8 mb-3 px-4">
                {step.title}
              </h3>

              <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base text-center tracking-[0] leading-[25.6px] px-4 max-w-[280px]">
                {step.description.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < step.description.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
