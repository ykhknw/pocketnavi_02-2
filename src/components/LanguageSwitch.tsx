import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';

interface LanguageSwitchProps {
  language: 'ja' | 'en';
  onToggle: () => void;
}

export function LanguageSwitch({ language, onToggle }: LanguageSwitchProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {language === 'ja' ? 'EN' : 'JP'}
      </span>
    </Button>
  );
}