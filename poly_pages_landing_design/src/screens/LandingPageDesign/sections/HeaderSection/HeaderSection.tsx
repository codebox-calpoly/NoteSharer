import { useState } from "react";

export const HeaderSection = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="flex flex-col w-full items-start pt-0 pb-px px-0 bg-white border-b [border-bottom-style:solid] border-neutral-200 sticky top-0 z-50">
      <div className="flex h-[72px] items-center justify-between px-4 md:px-8 py-0 relative w-full">
        <div className="flex items-center gap-3 relative">
          <img
            className="relative w-[54px] h-[54px]"
            alt="Poly Pages Logo"
            src="https://c.animaapp.com/vYVdVbUl/img/container-8.svg"
          />

          <div className="relative h-8">
            <h1 className="[text-shadow:0px_1px_1px_#00000040] [font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-xl md:text-2xl tracking-[0] leading-8 whitespace-nowrap">
              Poly Pages
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("why-poly-pages")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
          >
            Why Us
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
          >
            Features
          </button>
        </nav>

        {/* Desktop Login Button */}
        <button
          type="button"
          className="hidden md:block relative w-[95.05px] h-10 bg-variable-collection-warm-apricot rounded-[10px] border border-solid border-black shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 hover:shadow-[0px_6px_6px_#00000040] hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-[0px_2px_2px_#00000040]"
          aria-label="Log In"
        >
          <span className="absolute top-[7px] left-[25px] [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
            Log In
          </span>
        </button>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 cursor-pointer z-50"
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-[73px] left-0 w-full bg-white border-b border-neutral-200 transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
        style={{ zIndex: 40 }}
      >
        <nav className="flex flex-col items-start gap-4 px-8 py-6">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("why-poly-pages")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
          >
            Why Us
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
          >
            Features
          </button>
          <button
            type="button"
            className="relative w-full h-10 bg-variable-collection-warm-apricot rounded-[10px] border border-solid border-black shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 active:translate-y-[1px] active:shadow-[0px_2px_2px_#00000040] mt-2"
            aria-label="Log In"
          >
            <span className="[font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
              Log In
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
