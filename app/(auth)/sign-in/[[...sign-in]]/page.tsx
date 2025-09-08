import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex items-center justify-center py-24">
      <SignIn 
        redirectUrl="/"
        afterSignInUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-yellow-600 hover:bg-yellow-700',
            footerActionLink: 'text-yellow-600 hover:text-yellow-700'
          }
        }}
      />
    </main>
  );
}
