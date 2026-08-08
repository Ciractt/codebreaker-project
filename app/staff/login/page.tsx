import StaffLoginForm from './login-form';

export const metadata = { title: 'Staff sign in | Code Breaker' };

export default function StaffLoginPage() {
  return (
    <main className="flex-1 px-5 py-10 mx-auto w-full max-w-sm">
      <p className="label mb-4">Code breaker &middot; Staff</p>
      <h1 className="display text-[length:var(--step-2)] mb-6">Sign in</h1>
      <StaffLoginForm />
    </main>
  );
}
