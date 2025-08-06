import React from 'react';

interface FooterProps {
  language: 'ja' | 'en';
}

export function Footer({ language }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-600 text-sm">
          © 建築家.com 2024-{currentYear}
        </div>
      </div>
    </footer>
  );
} 