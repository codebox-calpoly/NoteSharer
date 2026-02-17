import { useEffect, useState } from "react";

export const HeroSection = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const backgroundElements = [
    {
      type: "formula",
      top: "top-20",
      left: "left-10",
      width: "w-[120px]",
      height: "h-[100px]",
      content: (
        <>
          <p className="absolute w-[125.83%] h-[22.00%] top-[12.00%] left-0 [font-family:'Inter',Helvetica] font-normal text-[#2e2e2e] text-lg tracking-[0] leading-[normal]">
            ∫ f(x)dx = F(x) + C
          </p>
          <img
            className="absolute w-[75.00%] h-0 top-[49.50%] left-[8.33%] object-cover"
            alt="Vector"
            src="https://c.animaapp.com/vYVdVbUl/img/vector.svg"
          />
          <div className="absolute w-[55.83%] h-[17.00%] top-[66.00%] left-0 [font-family:'Inter',Helvetica] font-normal text-[#2e2e2e] text-sm tracking-[0] leading-[normal]">
            lim (x→∞)
          </div>
        </>
      ),
    },
    {
      type: "equation",
      top: "top-40",
      left: "left-[737px]",
      width: "w-[100px]",
      height: "h-20",
      content: (
        <>
          <div className="absolute w-[59.00%] h-[23.75%] top-[5.00%] left-0 [font-family:'Inter',Helvetica] font-normal text-[#2e2e2e] text-base tracking-[0] leading-[normal] whitespace-nowrap">
            E = mc²
          </div>
          <img
            className="absolute w-[40.00%] h-[50.00%] top-[36.88%] left-[29.50%]"
            alt="Vector"
            src="https://c.animaapp.com/vYVdVbUl/img/vector-1.svg"
          />
        </>
      ),
    },
  ];

  return (
    <section
      className="relative w-full pt-16 md:pt-20 pb-16 md:pb-24 px-4 md:px-8"
      aria-label="Hero Section"
      id="hero"
    >
      <div
        className="absolute top-0 left-0 w-full h-full opacity-5 hidden lg:block pointer-events-none"
        aria-hidden="true"
      >
        {backgroundElements.map((element, index) => (
          <div
            key={index}
            className={`absolute ${element.top} ${element.left} ${element.width} ${element.height} ${element.type === "formula" ? "overflow-hidden" : ""}`}
          >
            {element.content}
          </div>
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto">
        <header
          className={`mb-8 md:mb-12 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="[font-family:'Inter',Helvetica] font-bold text-transparent text-3xl md:text-5xl lg:text-6xl text-center tracking-[0] leading-tight md:leading-[72px] px-4">
            <span className="text-[#2e2e2e]">Share notes. Earn credits. </span>
            <span className="text-[#6dbe8b]">Learn together.</span>
          </h1>
        </header>

        <div
          className={`mb-8 md:mb-12 transition-all duration-1000 delay-200 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="max-w-3xl mx-auto [font-family:'Inter',Helvetica] font-normal text-[#666666] text-base md:text-xl text-center tracking-[0] leading-relaxed md:leading-[34px] px-4">
            A peer to peer helping platform that rewards contribution. Upload
            your notes from class, earn credits, and unlock notes from students
            all across campus.
          </p>
        </div>

        <div
          className={`flex justify-center mb-12 md:mb-16 transition-all duration-1000 delay-400 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <button
            className="relative w-full max-w-[200px] h-[59px] bg-variable-collection-warm-apricot rounded-[14px] border border-solid border-[#080000] shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 hover:shadow-[0px_6px_8px_#00000050] hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-[0px_2px_2px_#00000040]"
            type="button"
            aria-label="Sign up for the platform"
          >
            <span className="[font-family:'Inter',Helvetica] font-semibold text-black text-lg text-center tracking-[0] leading-[27px] whitespace-nowrap">
              Sign Up
            </span>
          </button>
        </div>

        <div
          className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16 transition-all duration-1000 delay-600 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <img
            className="w-full max-w-[346px] h-auto"
            alt="Laptop displaying notes interface"
            src="https://c.animaapp.com/vYVdVbUl/img/mask-group@2x.png"
          />

          <img
            className="w-full max-w-[154px] h-auto"
            alt="Mobile phone displaying notes interface"
            src="https://c.animaapp.com/vYVdVbUl/img/mask-group-1@2x.png"
          />
        </div>
      </div>
    </section>
  );
};
