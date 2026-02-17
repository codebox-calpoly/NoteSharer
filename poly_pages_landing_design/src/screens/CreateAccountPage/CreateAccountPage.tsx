import { useState } from "react";

export const CreateAccountPage = (): JSX.Element => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      alert("Account created successfully!");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <img
                className="w-[54px] h-[54px]"
                alt="Poly Pages Logo"
                src="https://c.animaapp.com/vYVdVbUl/img/container-8.svg"
              />
              <h1 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-2xl">
                Poly Pages
              </h1>
            </div>
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#2e2e2e] text-3xl mb-2">
              Create Account
            </h2>
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#666666] text-base">
              Join the community and start sharing knowledge
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.fullName ? "border-red-500" : "border-neutral-300"
                } bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500 [font-family:'Inter',Helvetica]">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-neutral-300"
                } bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 [font-family:'Inter',Helvetica]">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-neutral-300"
                } bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 [font-family:'Inter',Helvetica]">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block [font-family:'Inter',Helvetica] font-medium text-[#2e2e2e] text-sm mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.confirmPassword ? "border-red-500" : "border-neutral-300"
                } bg-white [font-family:'Inter',Helvetica] text-base focus:outline-none focus:ring-2 focus:ring-[#6dbe8b] focus:border-transparent transition-all duration-200`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500 [font-family:'Inter',Helvetica]">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-variable-collection-warm-apricot rounded-lg border border-black shadow-md [font-family:'Inter',Helvetica] font-semibold text-[#2c1b1b] text-base hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center [font-family:'Inter',Helvetica] text-[#666666] text-sm">
            Already have an account?{" "}
            <a href="/sign-in" className="text-[#6dbe8b] font-medium hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#6dbe8b] to-[#90bf8e] items-center justify-center p-12">
        <div className="text-center text-white">
          <h3 className="[font-family:'Inter',Helvetica] font-bold text-4xl mb-4">
            Welcome to Poly Pages
          </h3>
          <p className="[font-family:'Inter',Helvetica] text-xl opacity-90">
            Share knowledge, earn credits, and succeed together
          </p>
        </div>
      </div>
    </div>
  );
};
