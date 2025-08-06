// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// その他のユーティリティ関数
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP');
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('ja-JP');
} 