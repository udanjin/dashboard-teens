// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from 'antd';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">The page you're looking for doesn't exist.</p>
      <Link href="/login">
        <Button type="primary">Return to Login</Button>
      </Link>
    </div>
  );
}