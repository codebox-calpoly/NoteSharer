import { useState } from "react";

export const UploadNotesPage = (): JSX.Element => {
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    noteTitle: "",
    description: "",
    file: null as File | null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.dataTransfer.files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    alert("Notes uploaded successfully! You earned 5 credits.");
  };

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
          <a href="/upload" className="[font-family:'Inter',Helvetica] font-medium text-[#6dbe8b]">
            Upload
          </a>
          <a href="/profile" className="[font-family:'Inter',Helvetica] font-medium text-[#666666] hover:text-[#6dbe8b] transition-colors duration-200">
            Profile
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl md:text-4xl mb-2">
              Upload Notes
            </h2>
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base md:text-lg">
              Share your knowledge and earn credits
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                  Course Code
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-lg border border-neutral-300 bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200"
                  placeholder="e.g., CS 101"
                  required
                />
              </div>

              <div>
                <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-lg border border-neutral-300 bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Intro to Computer Science"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Note Title
              </label>
              <input
                type="text"
                name="noteTitle"
                value={formData.noteTitle}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-lg border border-neutral-300 bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200"
                placeholder="e.g., Lecture 5 - Data Structures"
                required
              />
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Brief description of the notes..."
                required
              />
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Upload File
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? "border-[#6dbe8b] bg-[#6dbe8b]/5"
                    : "border-neutral-300 hover:border-[#6dbe8b]"
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt"
                />
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {formData.file ? (
                    <p className="[font-family:'Inter',Helvetica] text-[#2e2e2e] font-medium">
                      {formData.file.name}
                    </p>
                  ) : (
                    <>
                      <p className="[font-family:'Inter',Helvetica] text-[#2e2e2e] font-medium">
                        Drag and drop your file here
                      </p>
                      <p className="[font-family:'Inter',Helvetica] text-[#666666] text-sm">
                        or click to browse (PDF, DOC, DOCX, TXT)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#6dbe8b]/10 rounded-lg p-4 border border-[#6dbe8b]/20">
              <p className="[font-family:'Inter',Helvetica] text-[#2e2e2e] text-sm">
                <strong>Earn Credits:</strong> You'll receive 5 credits for uploading these notes. Credits can be used to unlock notes from other students.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-md [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-base hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Uploading..." : "Upload Notes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
