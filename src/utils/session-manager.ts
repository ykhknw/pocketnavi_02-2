class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;
  private searchHistory: Map<string, number> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private generateSessionId(): string {
    const existing = localStorage.getItem('user_session_id');
    if (existing) return existing;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_session_id', newId);
    return newId;
  }

  canSearch(query: string, searchType: string): boolean {
    const key = `${query}_${searchType}`;
    const lastSearch = this.searchHistory.get(key) || 0;
    const now = Date.now();
    const timeLimit = 60 * 60 * 1000; // 1時間

    if (now - lastSearch < timeLimit) {
      console.log(`重複検索をスキップ: ${query} (${searchType}) - 前回検索から${Math.round((now - lastSearch) / 1000 / 60)}分`);
      return false;
    }

    this.searchHistory.set(key, now);
    this.saveToStorage();
    console.log(`新しい検索を記録: ${query} (${searchType})`);
    return true;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        // 古いデータをクリア（1日以上前）
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.searchHistory = new Map(
          parsed.filter(([key, timestamp]: [string, number]) => timestamp > oneDayAgo)
        );
      }
    } catch (error) {
      console.warn('検索履歴の読み込みに失敗:', error);
      this.searchHistory = new Map();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('search_history', JSON.stringify(Array.from(this.searchHistory.entries())));
    } catch (error) {
      console.warn('検索履歴の保存に失敗:', error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // デバッグ用: 現在の検索履歴を表示
  getSearchHistory(): Map<string, number> {
    return new Map(this.searchHistory);
  }

  // デバッグ用: 検索履歴をクリア
  clearSearchHistory(): void {
    this.searchHistory.clear();
    localStorage.removeItem('search_history');
  }
}

export const sessionManager = SessionManager.getInstance();
