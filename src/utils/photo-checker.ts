// 写真ファイルの存在確認ユーティリティ

export interface PhotoInfo {
  url: string;
  exists: boolean;
  filename: string;
}

export class PhotoChecker {
  private static cache = new Map<string, PhotoInfo[]>();
  
  // 指定されたuidの写真ディレクトリをチェック
  static async checkPhotosForUid(uid: string): Promise<PhotoInfo[]> {
    if (!uid) return [];
    
    // キャッシュから取得
    if (this.cache.has(uid)) {
      return this.cache.get(uid)!;
    }
    
    const baseUrl = `https://kenchikuka.com/pictures/${uid}`;
    
    // 一般的なファイル名パターン
    const patterns = [
      `${uid}.webp`,
      `${uid}_01.webp`,
      `${uid}_02.webp`,
      `${uid}_03.webp`,
      `${uid}_04.webp`,
      `${uid}_05.webp`,
      `${uid}_main.webp`,
      `${uid}_thumb.webp`,
      // 日付パターン（例: SK_2003_04_175-0_20250619_0846.webp）
      `${uid}_${this.getCurrentDateString()}.webp`
    ];
    
    const photoInfos: PhotoInfo[] = [];
    
    // 各パターンの存在確認
    for (const pattern of patterns) {
      const url = `${baseUrl}/${pattern}`;
      const exists = await this.checkImageExists(url);
      
      photoInfos.push({
        url,
        exists,
        filename: pattern
      });
    }
    
    // キャッシュに保存（5分間）
    this.cache.set(uid, photoInfos);
    setTimeout(() => {
      this.cache.delete(uid);
    }, 5 * 60 * 1000);
    
    return photoInfos;
  }
  
  // 画像ファイルの存在確認
  private static async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // CORS制限を回避
      });
      return response.ok;
    } catch (error) {
      // no-corsモードでは詳細なエラー情報が取得できないため、
      // 実際の画像読み込みを試行
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // タイムアウト設定（3秒）
        setTimeout(() => resolve(false), 3000);
      });
    }
  }
  
  // 現在の日付文字列を生成（YYYYMMDD_HHMM形式）
  private static getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hour}${minute}`;
  }
  
  // 存在する写真のみを取得
  static async getExistingPhotos(uid: string): Promise<PhotoInfo[]> {
    const allPhotos = await this.checkPhotosForUid(uid);
    return allPhotos.filter(photo => photo.exists);
  }
}