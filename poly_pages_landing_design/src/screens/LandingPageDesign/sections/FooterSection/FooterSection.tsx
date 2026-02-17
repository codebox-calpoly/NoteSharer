export const FooterSection = (): JSX.Element => {
  const navigationLinks = [
    { label: "About", href: "#about" },
    { label: "Community Guidelines", href: "#community" },
  ];

  return (
    <footer className="flex flex-col w-full items-start pt-8 md:pt-12 pb-8 px-4 md:px-8 bg-neutral-50 border-t [border-top-style:solid] border-neutral-200">
      <div className="flex flex-col md:flex-row h-auto md:h-[61px] items-start md:items-center justify-between gap-6 md:gap-0 w-full max-w-6xl mx-auto">
        <div className="flex flex-col items-start gap-2">
          <div className="relative h-8">
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-2xl tracking-[0] leading-8 whitespace-nowrap">
              Poly Pages
            </h2>
          </div>

          <div className="relative h-[21px]">
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#999999] text-sm tracking-[0] leading-[21px] whitespace-nowrap">
              CodeBox TM
            </p>
          </div>
        </div>

        <nav
          className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"
          aria-label="Footer navigation"
        >
          {navigationLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="[font-family:'Inter',Helvetica] font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};
