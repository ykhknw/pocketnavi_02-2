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

function AppHeaderComponent({
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

// Props比較関数
const arePropsEqual = (prevProps: AppHeaderProps, nextProps: AppHeaderProps): boolean => {
  return (
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.currentUser?.email === nextProps.currentUser?.email &&
    prevProps.language === nextProps.language &&
    prevProps.onLoginClick === nextProps.onLoginClick &&
    prevProps.onLogout === nextProps.onLogout &&
    prevProps.onAdminClick === nextProps.onAdminClick &&
    prevProps.onLanguageToggle === nextProps.onLanguageToggle
  );
};

export const AppHeader = React.memo(AppHeaderComponent, arePropsEqual); 