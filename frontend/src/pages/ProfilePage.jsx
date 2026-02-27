import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
      <p className="mt-3 text-sm text-slate-700">
        <span className="font-semibold">Name:</span> {user?.name}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-semibold">Role:</span> {user?.role}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-semibold">Status:</span> Authenticated
      </p>
    </section>
  );
}
