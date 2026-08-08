import ResetForm from './reset-form';

export const metadata = { title: 'New password | Code Breaker' };

export default function ResetPage() {
  return (
    <main className="flex-1 px-5 py-10 mx-auto w-full max-w-sm">
      <p className="label mb-4">Staff</p>
      <h1 className="display text-[length:var(--step-2)] mb-6">Set a new password</h1>
      <ResetForm />
    </main>
  );
}
