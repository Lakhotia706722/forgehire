'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
