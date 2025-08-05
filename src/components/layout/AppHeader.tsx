import React from 'react';
import { Header } from '../Header';
import { User } from '../../types';

interface AppHeaderProps {
  isAuthenticated: boolean;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  language: 'ja' | 'en';
  onLanguageToggle: () => void;
}

export function AppHeader({
  isAuthenticated,
  currentUser,
  onLoginClick,
  onLogout,
  onAdminClick,
  language,
  onLanguageToggle
}: AppHeaderProps) {
  return (
    <Header
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      onLoginClick={onLoginClick}
      onLogout={onLogout}
      onAdminClick={onAdminClick}
      language={language}
      onLanguageToggle={onLanguageToggle}
    />
  );
} 