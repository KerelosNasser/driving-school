import { auth, currentUser } from '@clerk/nextjs/server';
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
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  if (!userEmail || userEmail !== adminEmail) {
    console.log('Admin access denied:', { userEmail, adminEmail, match: userEmail === adminEmail });
    redirect('/');
  }

  return <>{children}</>;
}
