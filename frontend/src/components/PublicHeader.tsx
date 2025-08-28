// src/components/PublicHeader.tsx
'use client';
import Link from 'next/link';
import { Button } from 'antd';

export default function PublicHeader() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Dashboard System
        </Link>
        
        <div className="space-x-4">
          <Link href="/login">
            <Button type="primary">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}