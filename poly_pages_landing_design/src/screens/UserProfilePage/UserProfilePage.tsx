import { useEffect, useState } from "react";

export const UserProfilePage = (): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState("uploaded");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const uploadedNotes = [
    { title: "Lecture 3 - Algorithms", course: "CS 201", downloads: 45, credits: 5 },
    { title: "Midterm Study Guide", course: "CS 101", downloads: 89, credits: 10 },
    { title: "Chapter 5 Summary", course: "MATH 301", downloads: 23, credits: 3 },
  ];

  const downloadedNotes = [
    { title: "Final Exam Notes", course: "CS 401", author: "John Doe", credits: 15 },
    { title: "Lab Report Template", course: "BIO 201", author: "Jane Smith", credits: 5 },
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
          <a href="/browse" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Browse
          </a>
          <a href="/upload" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Upload
          </a>
          <a href="/profile" className="[font-family:'Inter',Helvetica] font-medium text-[#6dbe8b]">
            Profile
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6dbe8b] to-[#90bf8e] flex items-center justify-center text-white text-3xl font-bold">
                JD
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-2xl md:text-3xl mb-2">
                  John Doe
                </h2>
                <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base mb-4">
                  Computer Science Major • Class of 2025
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-2xl">
                      125
                    </div>
                    <div className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">Credits</div>
                  </div>
                  <div className="text-center">
                    <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-2xl">
                      18
                    </div>
                    <div className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">Uploads</div>
                  </div>
                  <div className="text-center">
                    <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-2xl">
                      342
                    </div>
                    <div className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">Downloads</div>
                  </div>
                </div>
              </div>
              <button className="h-10 px-6 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-sm [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`mb-6 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex gap-4 border-b border-neutral-200">
              <button
                onClick={() => setSelectedTab("uploaded")}
                className={`pb-3 px-4 [font-family:'Inter',Helvetica] font-medium text-base transition-all duration-200 ${
                  selectedTab === "uploaded"
                    ? "text-[#6dbe8b] border-b-2 border-[#6dbe8b]"
                    : "text-[#666666] hover:text-[#6dbe8b]"
                }`}
              >
                My Uploads
              </button>
              <button
                onClick={() => setSelectedTab("downloaded")}
                className={`pb-3 px-4 [font-family:'Inter',Helvetica] font-medium text-base transition-all duration-200 ${
                  selectedTab === "downloaded"
                    ? "text-[#6dbe8b] border-b-2 border-[#6dbe8b]"
                    : "text-[#666666] hover:text-[#6dbe8b]"
                }`}
              >
                Downloaded
              </button>
            </div>
          </div>

          {/* Content */}
          {selectedTab === "uploaded" && (
            <div className="space-y-4">
              {uploadedNotes.map((note, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-xl mb-2">
                        {note.title}
                      </h3>
                      <p className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">
                        {note.course}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-xl">
                          {note.downloads}
                        </div>
                        <div className="[font-family:'Inter',Helvetica] text-[#666666] text-xs">downloads</div>
                      </div>
                      <div className="text-center">
                        <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-xl">
                          +{note.credits}
                        </div>
                        <div className="[font-family:'Inter',Helvetica] text-[#666666] text-xs">credits earned</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "downloaded" && (
            <div className="space-y-4">
              {downloadedNotes.map((note, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#2e2e2e] text-xl mb-2">
                        {note.title}
                      </h3>
                      <p className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">
                        {note.course} • By {note.author}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="[font-family:'Inter',Helvetica] font-bold text-[#6dbe8b] text-xl">
                          -{note.credits}
                        </div>
                        <div className="[font-family:'Inter',Helvetica] text-[#666666] text-xs">credits spent</div>
                      </div>
                      <button className="h-10 px-6 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-sm [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
