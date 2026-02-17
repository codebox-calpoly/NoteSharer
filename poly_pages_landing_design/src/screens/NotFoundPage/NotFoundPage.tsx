export const NotFoundPage = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between px-4 md:px-8 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <img
            className="w-[54px] h-[54px]"
            alt="Poly Pages Logo"
            src="https://c.animaapp.com/vYVdVbUl/img/container-8.svg"
          />
          <h1 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-xl md:text-2xl">
            Poly Pages
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-8xl md:text-9xl mb-4">
              404
            </h1>
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-2xl md:text-3xl mb-4">
              Page Not Found
            </h2>
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base md:text-lg mb-8">
              Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center h-12 px-8 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-md [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-base hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Go Home
            </a>
            <a
              href="/browse"
              className="inline-flex items-center justify-center h-12 px-8 bg-white rounded-lg border border-neutral-300 shadow-sm [font-family:'Inter',Helvetica] font-semibold text-[#666666] text-base hover:border-[#6dbe8b] hover:text-[#6dbe8b] hover:shadow-md transition-all duration-200"
            >
              Browse Courses
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
