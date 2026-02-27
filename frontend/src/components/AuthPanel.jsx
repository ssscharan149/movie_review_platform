import { useState } from "react";
import client from "../api/client";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function AuthPanel({ onSuccess, onError }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeText = (value) => value.replace(/[<>"'`]/g, "").trim();

  const validate = () => {
    const nextErrors = {};
    const cleanedName = sanitizeText(form.name);
    const cleanedEmail = form.email.trim().toLowerCase();
    const cleanedPassword = form.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "register") {
      if (!cleanedName) {
        nextErrors.name = "Name must not be empty";
      } else if (cleanedName.length < 2) {
        nextErrors.name = "Name must be at least 2 characters";
      }
    }

    if (!cleanedEmail) {
      nextErrors.email = "Email must not be empty";
    } else if (!emailRegex.test(cleanedEmail)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!cleanedPassword) {
      nextErrors.password = "Password must not be empty";
    } else if (mode === "register" && cleanedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "register" && !form.role) {
      nextErrors.role = "Role must not be empty";
    }

    setErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      cleanedPayload:
        mode === "register"
          ? {
              name: cleanedName,
              email: cleanedEmail,
              password: cleanedPassword,
              role: form.role,
            }
          : {
              email: cleanedEmail,
              password: cleanedPassword,
            },
    };
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const { isValid, cleanedPayload } = validate();
    if (!isValid) {
      onError("Please fix the highlighted form errors.");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const { data } = await client.post(endpoint, cleanedPayload);
      onSuccess(data, mode);
      setForm((prev) => ({ ...prev, password: "" }));
      setErrors({});
    } catch (error) {
      const apiMessage = error.response?.data?.message || "";
      const details = error.response?.data?.details;
      const detailText = details
        ? ` | ${Object.entries(details)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`
        : "";
      const lowerMessage = apiMessage.toLowerCase();
      if (lowerMessage.includes("invalid credentials")) {
        setErrors((prev) => ({
          ...prev,
          email: "Incorrect email or password",
          password: "Incorrect email or password",
        }));
        onError("Incorrect email or password");
        return;
      }

      onError(`Auth failed: ${apiMessage || error.message}${detailText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        {mode === "register" ? "Create account" : "Sign in"}
      </h1>
      <p className="mb-4 text-sm text-slate-600">Access your dashboard and start reviewing movies.</p>

      <form onSubmit={submit} className="grid gap-3">
        {mode === "register" && (
          <>
            <input
              className={`${inputClass} ${errors.name ? "border-rose-400 ring-rose-100" : ""}`}
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
            {errors.name && <p className="text-xs font-medium text-rose-600">{errors.name}</p>}
          </>
        )}
        <input
          className={`${inputClass} ${errors.email ? "border-rose-400 ring-rose-100" : ""}`}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          autoComplete={mode === "register" ? "email" : "username"}
          required
        />
        {errors.email && <p className="text-xs font-medium text-rose-600">{errors.email}</p>}
        <input
          className={`${inputClass} ${errors.password ? "border-rose-400 ring-rose-100" : ""}`}
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
        />
        {errors.password && <p className="text-xs font-medium text-rose-600">{errors.password}</p>}
        {mode === "register" && (
          <>
            <select className={`${inputClass} ${errors.role ? "border-rose-400 ring-rose-100" : ""}`} name="role" value={form.role} onChange={handleChange}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            {errors.role && <p className="text-xs font-medium text-rose-600">{errors.role}</p>}
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
          )}
          {isSubmitting ? "Please wait..." : mode === "register" ? "Register & Login" : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "register" ? "login" : "register"));
          setErrors({});
          setForm((prev) => ({ ...prev, password: "" }));
        }}
        className="mt-3 text-sm font-medium text-blue-700 transition hover:text-blue-900"
      >
        Switch to {mode === "register" ? "Login" : "Register"}
      </button>
    </section>
  );
}
