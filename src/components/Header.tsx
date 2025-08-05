import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, User, LogIn, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { LanguageSwitch } from './LanguageSwitch';
import { t } from '../utils/translations';

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser: any;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  language: 'ja' | 'en';
  onLanguageToggle: () => void;
}

export function Header({ 
  isAuthenticated, 
  currentUser, 
  onLoginClick, 
  onLogout, 
  onAdminClick, 
  language, 
  onLanguageToggle 
}: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Building className="h-8 w-8 mr-3 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('siteTitle', language)}</h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitch language={language} onToggle={onLanguageToggle} />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {t('hello', language)}, {currentUser?.name || 'User'}{language === 'ja' ? 'さん' : ''}
                </span>
                <Button
                  variant="ghost"
                  onClick={onAdminClick}
                >
                  {t('adminPanel', language)}
                </Button>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout', language)}
                </Button>
              </>
            ) : (
              <Button
                onClick={onLoginClick}
              >
                <LogIn className="h-4 w-4" />
                {t('login', language)}
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-2">
              <div className="px-4">
                <LanguageSwitch language={language} onToggle={onLanguageToggle} />
              </div>
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {t('hello', language)}, {currentUser?.name || 'User'}{language === 'ja' ? 'さん' : ''}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onAdminClick}
                  >
                    {t('adminPanel', language)}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout', language)}
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full"
                  onClick={onLoginClick}
                >
                  <LogIn className="h-4 w-4" />
                  {t('login', language)}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}