import { getStaffRole } from '@/lib/supabase/staff';
import StaffNav from './staff-nav';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: LayoutProps<'/staff'>) {
  const staff = await getStaffRole();

  // The sign-in page renders its own shell.
  if (!staff) return <>{children}</>;

  return (
    <div className="flex-1 flex flex-col">
      <StaffNav role={staff.role} email={staff.email} />
      {children}
    </div>
  );
}
