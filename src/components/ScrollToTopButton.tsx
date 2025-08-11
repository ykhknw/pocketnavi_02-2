import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ArrowUp, MoveUp } from 'lucide-react';
import { Button } from './ui/button';

interface ScrollToTopButtonProps {
  variant?: 'fab' | 'round' | 'rounded';
  className?: string;
  language?: 'ja' | 'en';
}

export function ScrollToTopButton({ 
  variant = 'fab', 
  className = '',
  language = 'ja'
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  // スクロール位置を監視
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // トップにスクロール
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  if (!isVisible) return null;

  // スタイルバリエーション
  const getButtonStyles = () => {
    switch (variant) {
      case 'fab':
        return {
          button: "fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50",
          icon: "w-6 h-6",
          tooltip: "fixed bottom-20 right-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        };
      case 'round':
        return {
          button: "fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 z-50",
          icon: "w-5 h-5",
          tooltip: "fixed bottom-20 right-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        };
      case 'rounded':
        return {
          button: "fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50",
          icon: "w-5 h-5",
          tooltip: "fixed bottom-20 right-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        };
      default:
        return {
          button: "fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50",
          icon: "w-6 h-6",
          tooltip: "fixed bottom-20 right-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        };
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'fab':
        return <ChevronUp className={getButtonStyles().icon} />;
      case 'round':
        return <ArrowUp className={getButtonStyles().icon} />;
      case 'rounded':
        return <MoveUp className={getButtonStyles().icon} />;
      default:
        return <ChevronUp className={getButtonStyles().icon} />;
    }
  };

  const getTooltipText = () => {
    switch (variant) {
      case 'fab':
        return language === 'ja' ? 'トップへ' : 'To Top';
      case 'round':
        return language === 'ja' ? '上へ' : 'Up';
      case 'rounded':
        return language === 'ja' ? 'ページトップ' : 'Page Top';
      default:
        return language === 'ja' ? 'トップへ' : 'To Top';
    }
  };

  const styles = getButtonStyles();

  return (
    <div className="group">
      <Button
        onClick={scrollToTop}
        className={`${styles.button} ${className}`}
        aria-label={getTooltipText()}
        title={getTooltipText()}
      >
        {getIcon()}
      </Button>
      
      {/* ツールチップ */}
      <div className={styles.tooltip}>
        {getTooltipText()}
      </div>
    </div>
  );
}

// デフォルトエクスポート
export default ScrollToTopButton;
