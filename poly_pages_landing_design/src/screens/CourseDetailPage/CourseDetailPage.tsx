import { useEffect, useState } from "react";

export const CourseDetailPage = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState("recent");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const notes = [
    { title: "Lecture 1 - Introduction", author: "John Doe", date: "2 days ago", credits: 5, rating: 4.5 },
    { title: "Midterm Study Guide", author: "Jane Smith", date: "1 week ago", credits: 10, rating: 5.0 },
    { title: "Chapter 3 Summary", author: "Mike Johnson", date: "2 weeks ago", credits: 3, rating: 4.0 },
    { title: "Final Exam Notes", author: "Sarah Williams", date: "3 weeks ago", credits: 15, rating: 4.8 },
  ];

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
          {/* Back Button */}
          <div
            className={`mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <a
              href="/browse"
              className="inline-flex items-center gap-2 [font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Browse
            </a>
          </div>

          {/* Course Header */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl mb-2">
                  CS 101
                </h2>
                <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-lg md:text-xl">
                  Introduction to Computer Science
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="bg-[#6dbe8b] text-white px-4 py-2 rounded-full text-sm font-semibold">
                  150 notes available
                </div>
                <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-sm">
                  Professor: Dr. Smith
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`mb-6 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex gap-4 border-b border-neutral-200">
              <button
                onClick={() => setSelectedTab("recent")}
                className={`pb-3 px-4 [font-family:'Inter',Helvetica] font-medium text-base transition-all duration-200 ${
                  selectedTab === "recent"
                    ? "text-[#6dbe8b] border-b-2 border-[#6dbe8b]"
                    : "text-[#666666] hover:text-[#6dbe8b]"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSelectedTab("popular")}
                className={`pb-3 px-4 [font-family:'Inter',Helvetica] font-medium text-base transition-all duration-200 ${
                  selectedTab === "popular"
                    ? "text-[#6dbe8b] border-b-2 border-[#6dbe8b]"
                    : "text-[#666666] hover:text-[#6dbe8b]"
                }`}
              >
                Most Popular
              </button>
              <button
                onClick={() => setSelectedTab("rated")}
                className={`pb-3 px-4 [font-family:'Inter',Helvetica] font-medium text-base transition-all duration-200 ${
                  selectedTab === "rated"
                    ? "text-[#6dbe8b] border-b-2 border-[#6dbe8b]"
                    : "text-[#666666] hover:text-[#6dbe8b]"
                }`}
              >
                Top Rated
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index + 4) * 100}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-xl mb-2">
                      {note.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#666666]">
                      <span className="[font-family:'Inter',Helvetica]">By {note.author}</span>
                      <span className="[font-family:'Inter',Helvetica]">{note.date}</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="[font-family:'Inter',Helvetica] font-medium">{note.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-2xl">
                        {note.credits}
                      </div>
                      <div className="[font-family:'Inter',Helvetica] text-[#666666] text-xs">credits</div>
                    </div>
                    <button className="h-10 px-6 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-sm [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap">
                      View Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
