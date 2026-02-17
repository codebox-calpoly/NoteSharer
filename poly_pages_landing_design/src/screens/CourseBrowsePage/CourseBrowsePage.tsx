import { useEffect, useRef, useState } from "react";

export const CourseBrowsePage = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const courses = [
    { name: "Introduction to Computer Science", code: "CS 101", credits: 150 },
    { name: "Data Structures", code: "CS 201", credits: 200 },
    { name: "Algorithms", code: "CS 301", credits: 250 },
    { name: "Database Systems", code: "CS 401", credits: 180 },
    { name: "Web Development", code: "CS 202", credits: 170 },
    { name: "Machine Learning", code: "CS 501", credits: 300 },
  ];

  const filters = ["All", "CS", "MATH", "ENG", "BIO"];

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between px-4 md:px-8 bg-white border-b border-neutral-200 sticky top-0 z-50">
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
        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Home
          </a>
          <a href="/browse" className="[font-family:'Inter',Helvetica] font-medium text-[#6dbe8b]">
            Browse
          </a>
          <a href="/upload" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Upload
          </a>
          <a href="/profile" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Profile
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div
            className={`mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl mb-2">
              Browse Courses
            </h2>
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base md:text-lg">
              Find notes from courses across campus
            </p>
          </div>

          {/* Search Bar */}
          <div
            className={`mb-6 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 px-6 pr-12 rounded-xl border border-neutral-300 bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#666666]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div
            className={`mb-8 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-6 py-2 rounded-full [font-family:'Inter',Helvetica] font-medium text-sm transition-all duration-200 ${
                    selectedFilter === filter
                      ? "bg-[#6dbe8b] text-white shadow-md"
                      : "bg-white text-[#666666] border border-neutral-300 hover:border-[#6dbe8b] hover:text-[#6dbe8b]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index + 4) * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-lg mb-1">
                      {course.code}
                    </h3>
                    <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-sm">
                      {course.name}
                    </p>
                  </div>
                  <div className="bg-[#6dbe8b] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {course.credits} notes
                  </div>
                </div>
                <button className="w-full mt-4 h-10 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-sm [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                  View Notes
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
