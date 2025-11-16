import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';

/**
 * Check if the current user is an admin
 * Uses the email address from Clerk to compare with NEXT_PUBLIC_ADMIN_EMAIL
 * Also checks publicMetadata.role === 'admin'
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    // Get the current user to access email addresses and metadata
    const user = await currentUser();
    
    // Check if user has admin role in metadata
    if (user?.publicMetadata?.role === 'admin') {
      return true;
    }

    // Fallback to email check
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('NEXT_PUBLIC_ADMIN_EMAIL is not configured');
      return false;
    }

    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    return userEmail === adminEmail;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a specific user ID is an admin
 * @param userId - The Clerk user ID to check
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Check if user has admin role in metadata
    if (user.publicMetadata?.role === 'admin') {
      return true;
    }

    // Fallback to email check
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('NEXT_PUBLIC_ADMIN_EMAIL is not configured');
      return false;
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    return userEmail === adminEmail;
  } catch (error) {
    console.error('Error checking user admin status:', error);
    return false;
  }
}
