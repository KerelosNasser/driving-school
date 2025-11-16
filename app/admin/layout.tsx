import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Check if user is authenticated
  if (!userId) {
    redirect('/sign-in?redirect_url=/admin');
  }

  // Check if user is admin (using environment variable)
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  // Get user's email from Clerk
  const { sessionClaims } = await auth();
  const userEmail = sessionClaims?.email as string | undefined;

  if (!userEmail || userEmail !== adminEmail) {
    redirect('/');
  }

  return <>{children}</>;
}
