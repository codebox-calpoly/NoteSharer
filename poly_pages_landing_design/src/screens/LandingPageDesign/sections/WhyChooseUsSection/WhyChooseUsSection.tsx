import { useEffect, useRef, useState } from "react";

export const WhyChooseUsSection = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
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

  const features = [
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-3.svg",
      title: "Organized and searchable notes",
      description:
        "Find exactly what you need with smart categorization and powerful search across all subjects and courses.",
    },
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-4.svg",
      title: "Fair credit based system",
      description:
        "Contribute to earn, use credits to access. A balanced ecosystem that rewards quality and participation. Learn more",
    },
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-5.svg",
      title: "Built for students, by students",
      description:
        "Designed with real student needs in mind. Community-driven and focused on collaborative learning.",
    },
    {
      icon: "https://c.animaapp.com/vYVdVbUl/img/container-6.svg",
      title: "Clean and distraction free experience",
      description:
        "No clutter, no ads. Just a simple, intuitive platform designed to help you study better.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="why-poly-pages"
      className="flex flex-col w-full items-start gap-12 md:gap-16 px-4 md:px-8 py-16 md:py-24"
    >
      <header className="relative w-full">
        <h2
          className={`[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Why Poly Pages?
        </h2>
      </header>

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className={`flex flex-col bg-white rounded-2xl shadow-[0px_4px_20px_#00000014] p-8 md:p-10 transition-all duration-700 hover:shadow-[0px_8px_30px_#00000020] hover:translate-y-[-4px] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <img
                className="w-16 h-16 mb-6 transition-transform duration-300 hover:scale-110"
                alt={`${feature.title} icon`}
                src={feature.icon}
              />

              <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-xl md:text-2xl tracking-[0] leading-8 mb-4">
                {feature.title}
              </h3>

              <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base tracking-[0] leading-[27.2px]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
