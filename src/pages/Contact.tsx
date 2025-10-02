import React, { useState } from "react";
import api from "../utils/axiosInstance";
import { isAxiosError } from "axios";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export const Contact = () => {
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    message: "",
  });
  // Per-field error state
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>("");

  // Validate a single field
  const validateField = (name: string, value: string) => {
    if (name === "name") {
      if (!value.trim()) return "Name is required.";
      if (value.length < 2) return "Name must be at least 2 characters.";
    }
    if (name === "email") {
      if (!value.trim()) return "Email is required.";
      // Simple email regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address.";
    }
    if (name === "message") {
      if (!value.trim()) return "Message is required.";
      if (value.length < 10) return "Message must be at least 10 characters.";
    }
    return "";
  };

  // Validate all fields
  const validateAll = () => {
    const errors: { name?: string; email?: string; message?: string } = {};
    errors.name = validateField("name", form.name);
    errors.email = validateField("email", form.email);
    errors.message = validateField("message", form.message);
    setFieldErrors(errors);
    return !errors.name && !errors.email && !errors.message;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Validate on change
    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: validateField(e.target.name, e.target.value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitted(false);
    // Validate all fields before submit
    if (!validateAll()) {
      return;
    }
    setLoading(true);
    try {
      await api.post("/email/contact-us", form);
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
      setFieldErrors({});
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to send message. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f6fb] via-[#e7eaf7] to-[#e3c6e6] pb-20 pt-3">
      {/* Hero Section */}
      <div className="text-center mt-10 mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-[#1a144b] mb-3">
          Contact Us
        </h1>
        <p className="text-lg md:text-xl text-[#848199]">
          We'd love to hear from you! Fill out the form below.
        </p>
      </div>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        {/* Contact Form */}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[#1a144b]">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`px-4 py-2 rounded-lg border focus:border-violet-600 outline-none bg-[#f3f6fb] ${
                fieldErrors.name ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Your name"
            />
            <div className="text-red-500 text-sm">{fieldErrors.name}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[#1a144b]">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`px-4 py-2 rounded-lg border focus:border-violet-600 outline-none bg-[#f3f6fb] ${
                fieldErrors.email ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Your email"
            />
            <div className="text-red-500 text-sm">{fieldErrors.email}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[#1a144b]">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              className={`px-4 py-2 rounded-lg border focus:border-violet-600 outline-none bg-[#f3f6fb] resize-none ${
                fieldErrors.message ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Your message"
            />
            <div className="text-red-500 text-sm">{fieldErrors.message}</div>
          </div>
          <button
            type="submit"
            className="mt-2 px-8 py-3 rounded-full bg-[#7c7890] text-white font-semibold shadow hover:bg-[#5c5870] transition text-lg cursor-pointer disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
          {error && (
            <div className="text-red-500 font-semibold mt-2">{error}</div>
          )}
          {submitted && (
            <div className="text-green-600 font-semibold mt-2">
              Thank you! We'll get back to you soon.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
