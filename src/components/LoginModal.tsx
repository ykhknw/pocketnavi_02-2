import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { t } from '../utils/translations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string) => void;
  language: 'ja' | 'en';
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister, language }: LoginModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(formData.email, formData.password, formData.name);
    } else {
      onLogin(formData.email, formData.password);
    }
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRegistering ? t('registerTitle', language) : t('loginTitle', language)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                {t('name', language)}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  placeholder={language === 'ja' ? 'お名前を入力' : 'Enter your name'}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              {t('email', language)}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                placeholder={language === 'ja' ? 'メールアドレスを入力' : 'Enter your email'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              {t('password', language)}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                placeholder={language === 'ja' ? 'パスワードを入力' : 'Enter your password'}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
          >
            {isRegistering ? t('register', language) : t('login', language)}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary hover:text-primary/80 text-sm"
          >
            {isRegistering ? t('alreadyHaveAccount', language) : t('noAccount', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}