import ForgotForm from './forgot-form';

export const metadata = { title: 'Reset password | Code Breaker' };

export default function ForgotPage() {
  return (
    <main className="flex-1 px-5 py-10 md:py-20 mx-auto w-full max-w-sm">
      <p className="label mb-4">Staff</p>
      <h1 className="display text-[length:var(--step-2)] mb-3">Forgotten your password</h1>
      <p className="text-[length:var(--step--1)] text-[var(--ink-mute)] mb-7 leading-relaxed">
        Put your work email in and we&rsquo;ll send you a link to set a new one.
      </p>
      <ForgotForm />
    </main>
  );
}
