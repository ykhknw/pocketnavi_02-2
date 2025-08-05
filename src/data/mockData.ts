import { Building, Architect, Photo } from '../types';

export const mockBuildings: Building[] = [
  {
    id: 1,
    uid: 'building_001',
    title: '21_21 DESIGN SIGHT',
    titleEn: '21_21 DESIGN SIGHT',
    thumbnailUrl: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example1',
    completionYears: 2007,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館', 'ギャラリー'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '東京都',
    areas: '港区',
    location: '東京都港区赤坂9-7-6',
    architectDetails: 'デザインの力で人々の生活を豊かにすることを目指すデザイン施設',
    lat: 35.6762,
    lng: 139.7263,
    architects: [
      {
        architect_id: 1,
        architectJa: '安藤忠雄',
        architectEn: 'Tadao Ando',
        websites: [
          {
            website_id: 1,
            url: 'https://www.tadao-ando.com/',
            title: '安藤忠雄建築研究所',
            invalid: false,
            architectJa: '安藤忠雄',
            architectEn: 'Tadao Ando'
          }
        ]
      }
    ],
    photos: [
      {
        id: 1,
        building_id: 1,
        url: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 15,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 16,
        building_id: 1,
        url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 8,
        created_at: '2024-01-16T14:30:00Z'
      },
      {
        id: 17,
        building_id: 1,
        url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 12,
        created_at: '2024-01-17T09:15:00Z'
      }
    ],
    likes: 42,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    uid: 'building_002',
    title: '国立新美術館',
    titleEn: 'The National Art Center Tokyo',
    thumbnailUrl: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example2',
    completionYears: 2007,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '東京都',
    areas: '港区',
    location: '東京都港区六本木7-22-2',
    architectDetails: '日本最大級の展示スペースを有する美術館',
    lat: 35.6655,
    lng: 139.7277,
    architects: [
      {
        architect_id: 2,
        architectJa: '黒川紀章',
        architectEn: 'Kisho Kurokawa',
        websites: [
          {
            website_id: 2,
            url: 'https://www.kisho.co.jp/',
            title: '黒川紀章建築都市設計事務所',
            invalid: false,
            architectJa: '黒川紀章',
            architectEn: 'Kisho Kurokawa'
          }
        ]
      }
    ],
    photos: [
      {
        id: 2,
        building_id: 2,
        url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 28,
        created_at: '2024-01-12T14:30:00Z'
      }
    ],
    likes: 67,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-12T14:30:00Z'
  },
  {
    id: 3,
    uid: 'building_003',
    title: '東京駅',
    titleEn: 'Tokyo Station',
    thumbnailUrl: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 1914,
    parentBuildingTypes: ['交通施設'],
    buildingTypes: ['駅舎'],
    parentStructures: ['煉瓦造'],
    structures: ['煉瓦造', '鉄骨造'],
    prefectures: '東京都',
    areas: '千代田区',
    location: '東京都千代田区丸の内1-9-1',
    architectDetails: '日本の玄関口として親しまれる歴史的建造物',
    lat: 35.6812,
    lng: 139.7671,
    architects: [
      {
        architect_id: 3,
        architectJa: '辰野金吾',
        architectEn: 'Kingo Tatsuno',
        websites: []
      }
    ],
    photos: [
      {
        id: 3,
        building_id: 3,
        url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 89,
        created_at: '2024-01-10T09:15:00Z'
      }
    ],
    likes: 156,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-10T09:15:00Z'
  },
  {
    id: 4,
    uid: 'building_004',
    title: '代官山 蔦屋書店',
    titleEn: 'Daikanyama T-Site',
    thumbnailUrl: 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example4',
    completionYears: 2011,
    parentBuildingTypes: ['商業施設'],
    buildingTypes: ['書店', '複合施設'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造'],
    prefectures: '東京都',
    areas: '渋谷区',
    location: '東京都渋谷区猿楽町17-5',
    architectDetails: '本と映画とカフェが融合した新しいライフスタイル提案型書店',
    lat: 35.6502,
    lng: 139.6957,
    architects: [
      {
        architect_id: 4,
        architectJa: 'クライン・ダイサム・アーキテクツ',
        architectEn: 'Klein Dytham Architecture',
        websites: [
          {
            website_id: 4,
            url: 'https://www.klein-dytham.com/',
            title: 'Klein Dytham Architecture',
            invalid: false,
            architectJa: 'クライン・ダイサム・アーキテクツ',
            architectEn: 'Klein Dytham Architecture'
          }
        ]
      }
    ],
    photos: [
      {
        id: 4,
        building_id: 4,
        url: 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 34,
        created_at: '2024-01-08T16:45:00Z'
      }
    ],
    likes: 93,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-08T16:45:00Z'
  },
  {
    id: 5,
    uid: 'building_005',
    title: '表参道ヒルズ',
    titleEn: 'Omotesando Hills',
    thumbnailUrl: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example5',
    completionYears: 2006,
    parentBuildingTypes: ['商業施設'],
    buildingTypes: ['ショッピングモール'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '東京都',
    areas: '渋谷区',
    location: '東京都渋谷区神宮前4-12-10',
    architectDetails: '表参道の象徴的な商業施設として設計された建物',
    lat: 35.6659,
    lng: 139.7107,
    architects: [
      {
        architect_id: 1,
        architectJa: '安藤忠雄',
        architectEn: 'Tadao Ando',
        websites: [
          {
            website_id: 1,
            url: 'https://www.tadao-ando.com/',
            title: '安藤忠雄建築研究所',
            invalid: false,
            architectJa: '安藤忠雄',
            architectEn: 'Tadao Ando'
          }
        ]
      }
    ],
    photos: [
      {
        id: 5,
        building_id: 5,
        url: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 52,
        created_at: '2024-01-06T11:20:00Z'
      }
    ],
    likes: 128,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-06T11:20:00Z'
  },
  {
    id: 6,
    uid: 'building_006',
    title: '森美術館',
    titleEn: 'Mori Art Museum',
    thumbnailUrl: 'https://images.pexels.com/photos/1831234/pexels-photo-1831234.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 2003,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '東京都',
    areas: '港区',
    location: '東京都港区六本木6-10-1',
    architectDetails: '六本木ヒルズ森タワーの最上階に位置する現代美術館',
    lat: 35.6606,
    lng: 139.7288,
    architects: [
      {
        architect_id: 5,
        architectJa: 'コーン・ペダーセン・フォックス',
        architectEn: 'Kohn Pedersen Fox',
        websites: [
          {
            website_id: 5,
            url: 'https://www.kpf.com/',
            title: 'Kohn Pedersen Fox Associates',
            invalid: false,
            architectJa: 'コーン・ペダーセン・フォックス',
            architectEn: 'Kohn Pedersen Fox'
          }
        ]
      }
    ],
    photos: [],
    likes: 74,
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z'
  },
  {
    id: 7,
    uid: 'building_007',
    title: '金沢21世紀美術館',
    titleEn: '21st Century Museum of Contemporary Art, Kanazawa',
    thumbnailUrl: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example7',
    completionYears: 2004,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '石川県',
    areas: '金沢市',
    location: '石川県金沢市広坂1-2-1',
    architectDetails: '円形の建物が特徴的な現代美術館',
    lat: 36.5606,
    lng: 136.6581,
    architects: [
      {
        architect_id: 6,
        architectJa: '妹島和世+西沢立衛/SANAA',
        architectEn: 'Kazuyo Sejima + Ryue Nishizawa / SANAA',
        websites: []
      }
    ],
    photos: [
      {
        id: 6,
        building_id: 7,
        url: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 41,
        created_at: '2024-01-05T12:30:00Z'
      }
    ],
    likes: 98,
    created_at: '2024-01-07T00:00:00Z',
    updated_at: '2024-01-05T12:30:00Z'
  },
  {
    id: 8,
    uid: 'building_008',
    title: '東京国際フォーラム',
    titleEn: 'Tokyo International Forum',
    thumbnailUrl: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 1997,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['コンベンションセンター'],
    parentStructures: ['鉄骨造'],
    structures: ['鉄骨造', 'ガラス'],
    prefectures: '東京都',
    areas: '千代田区',
    location: '東京都千代田区丸の内3-5-1',
    architectDetails: 'ガラスの船をイメージした大空間',
    lat: 35.6766,
    lng: 139.7633,
    architects: [
      {
        architect_id: 7,
        architectJa: 'ラファエル・ヴィニオリ',
        architectEn: 'Rafael Viñoly',
        websites: []
      }
    ],
    photos: [],
    likes: 65,
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-08T00:00:00Z'
  },
  {
    id: 9,
    uid: 'building_009',
    title: 'すみだ北斎美術館',
    titleEn: 'Sumida Hokusai Museum',
    thumbnailUrl: 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example9',
    completionYears: 2016,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', 'アルミパネル'],
    prefectures: '東京都',
    areas: '墨田区',
    location: '東京都墨田区亀沢2-7-2',
    architectDetails: 'アルミパネルの外観が特徴的な美術館',
    lat: 35.6959,
    lng: 139.7947,
    architects: [
      {
        architect_id: 8,
        architectJa: '妹島和世',
        architectEn: 'Kazuyo Sejima',
        websites: []
      }
    ],
    photos: [
      {
        id: 7,
        building_id: 9,
        url: 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 23,
        created_at: '2024-01-04T08:15:00Z'
      }
    ],
    likes: 54,
    created_at: '2024-01-09T00:00:00Z',
    updated_at: '2024-01-04T08:15:00Z'
  },
  {
    id: 10,
    uid: 'building_010',
    title: '豊田市美術館',
    titleEn: 'Toyota Municipal Museum of Art',
    thumbnailUrl: 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 1995,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造'],
    prefectures: '愛知県',
    areas: '豊田市',
    location: '愛知県豊田市小坂本町8-5-1',
    architectDetails: '自然と調和した美術館建築',
    lat: 35.0833,
    lng: 137.1561,
    architects: [
      {
        architect_id: 9,
        architectJa: '谷口吉生',
        architectEn: 'Yoshio Taniguchi',
        websites: []
      }
    ],
    photos: [],
    likes: 37,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 11,
    uid: 'building_011',
    title: '直島地中美術館',
    titleEn: 'Chichu Art Museum',
    thumbnailUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example11',
    completionYears: 2004,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造'],
    prefectures: '香川県',
    areas: '直島町',
    location: '香川県香川郡直島町3449-1',
    architectDetails: '地中に埋められた美術館',
    lat: 34.4606,
    lng: 133.9956,
    architects: [
      {
        architect_id: 1,
        architectJa: '安藤忠雄',
        architectEn: 'Tadao Ando',
        websites: [
          {
            website_id: 1,
            url: 'https://www.tadao-ando.com/',
            title: '安藤忠雄建築研究所',
            invalid: false,
            architectJa: '安藤忠雄',
            architectEn: 'Tadao Ando'
          }
        ]
      }
    ],
    photos: [
      {
        id: 8,
        building_id: 11,
        url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 67,
        created_at: '2024-01-03T14:20:00Z'
      }
    ],
    likes: 142,
    created_at: '2024-01-11T00:00:00Z',
    updated_at: '2024-01-03T14:20:00Z'
  },
  {
    id: 12,
    uid: 'building_012',
    title: '京都国立博物館',
    titleEn: 'Kyoto National Museum',
    thumbnailUrl: 'https://images.pexels.com/photos/1831234/pexels-photo-1831234.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 1897,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['博物館'],
    parentStructures: ['煉瓦造'],
    structures: ['煉瓦造', '鉄骨造'],
    prefectures: '京都府',
    areas: '東山区',
    location: '京都府京都市東山区茶屋町527',
    architectDetails: '明治時代の洋風建築',
    lat: 34.9876,
    lng: 135.7727,
    architects: [
      {
        architect_id: 10,
        architectJa: '片山東熊',
        architectEn: 'Tokuma Katayama',
        websites: []
      }
    ],
    photos: [],
    likes: 83,
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  },
  {
    id: 13,
    uid: 'building_013',
    title: '水戸芸術館',
    titleEn: 'Art Tower Mito',
    thumbnailUrl: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example13',
    completionYears: 1990,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館', 'コンサートホール'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', '鉄骨造'],
    prefectures: '茨城県',
    areas: '水戸市',
    location: '茨城県水戸市五軒町1-6-8',
    architectDetails: 'らせん状のタワーが特徴的な複合文化施設',
    lat: 36.3706,
    lng: 140.4633,
    architects: [
      {
        architect_id: 11,
        architectJa: '磯崎新',
        architectEn: 'Arata Isozaki',
        websites: []
      }
    ],
    photos: [
      {
        id: 9,
        building_id: 13,
        url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 35,
        created_at: '2024-01-02T16:45:00Z'
      }
    ],
    likes: 76,
    created_at: '2024-01-13T00:00:00Z',
    updated_at: '2024-01-02T16:45:00Z'
  },
  {
    id: 14,
    uid: 'building_014',
    title: '札幌ドーム',
    titleEn: 'Sapporo Dome',
    thumbnailUrl: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 2001,
    parentBuildingTypes: ['スポーツ施設'],
    buildingTypes: ['ドーム', 'スタジアム'],
    parentStructures: ['鉄骨造'],
    structures: ['鉄骨造', 'テフロン膜'],
    prefectures: '北海道',
    areas: '豊平区',
    location: '北海道札幌市豊平区羊ケ丘1',
    architectDetails: '可動式天然芝サッカーピッチを持つドーム',
    lat: 43.0154,
    lng: 141.4094,
    architects: [
      {
        architect_id: 12,
        architectJa: '原広司',
        architectEn: 'Hiroshi Hara',
        websites: []
      }
    ],
    photos: [],
    likes: 91,
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z'
  },
  {
    id: 15,
    uid: 'building_015',
    title: 'せんだいメディアテーク',
    titleEn: 'Sendai Mediatheque',
    thumbnailUrl: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example15',
    completionYears: 2001,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['図書館', 'ギャラリー'],
    parentStructures: ['鉄骨造'],
    structures: ['鉄骨造', 'ガラス'],
    prefectures: '宮城県',
    areas: '青葉区',
    location: '宮城県仙台市青葉区春日町2-1',
    architectDetails: 'チューブ構造が特徴的な複合文化施設',
    lat: 38.2682,
    lng: 140.8694,
    architects: [
      {
        architect_id: 13,
        architectJa: '伊東豊雄',
        architectEn: 'Toyo Ito',
        websites: []
      }
    ],
    photos: [
      {
        id: 10,
        building_id: 15,
        url: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 48,
        created_at: '2024-01-01T18:30:00Z'
      }
    ],
    likes: 105,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-01T18:30:00Z'
  },
  {
    id: 16,
    uid: 'building_016',
    title: '三重県立美術館',
    titleEn: 'Mie Prefectural Art Museum',
    thumbnailUrl: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example16',
    completionYears: 1982,
    parentBuildingTypes: ['文化施設'],
    buildingTypes: ['美術館'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造'],
    prefectures: '三重県',
    areas: '津市',
    location: '三重県津市大谷町11',
    architectDetails: '三重県の芸術文化の拠点となる美術館',
    lat: 34.7303,
    lng: 136.5086,
    architects: [
      {
        architect_id: 14,
        architectJa: '磯崎新',
        architectEn: 'Arata Isozaki',
        websites: []
      }
    ],
    photos: [
      {
        id: 11,
        building_id: 16,
        url: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 25,
        created_at: '2024-01-01T12:00:00Z'
      }
    ],
    likes: 67,
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 17,
    uid: 'building_017',
    title: '伊勢神宮',
    titleEn: 'Ise Grand Shrine',
    thumbnailUrl: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: '',
    completionYears: 2013,
    parentBuildingTypes: ['宗教施設'],
    buildingTypes: ['神社'],
    parentStructures: ['木造'],
    structures: ['木造'],
    prefectures: '三重県',
    areas: '伊勢市',
    location: '三重県伊勢市神田町1',
    architectDetails: '日本最高の神宮として知られる神社',
    lat: 34.4583,
    lng: 136.7256,
    architects: [
      {
        architect_id: 15,
        architectJa: '伝統工芸',
        architectEn: 'Traditional Craft',
        websites: []
      }
    ],
    photos: [
      {
        id: 12,
        building_id: 17,
        url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 89,
        created_at: '2024-01-01T15:30:00Z'
      }
    ],
    likes: 156,
    created_at: '2024-01-17T00:00:00Z',
    updated_at: '2024-01-01T15:30:00Z'
  },
  {
    id: 18,
    uid: 'building_018',
    title: '鈴鹿サーキット',
    titleEn: 'Suzuka Circuit',
    thumbnailUrl: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=example18',
    completionYears: 1962,
    parentBuildingTypes: ['スポーツ施設'],
    buildingTypes: ['サーキット'],
    parentStructures: ['鉄筋コンクリート造'],
    structures: ['RC造', 'アスファルト'],
    prefectures: '三重県',
    areas: '鈴鹿市',
    location: '三重県鈴鹿市稲生町7992',
    architectDetails: 'F1日本グランプリが開催される国際的なレーシングコース',
    lat: 34.8431,
    lng: 136.5411,
    architects: [
      {
        architect_id: 16,
        architectJa: '本田宗一郎',
        architectEn: 'Soichiro Honda',
        websites: []
      }
    ],
    photos: [
      {
        id: 13,
        building_id: 18,
        url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=1200',
        thumbnail_url: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=400',
        likes: 112,
        created_at: '2024-01-01T20:45:00Z'
      }
    ],
    likes: 234,
    created_at: '2024-01-18T00:00:00Z',
    updated_at: '2024-01-01T20:45:00Z'
  }
];

export const buildingTypes = [
  '美術館', 'ギャラリー', '博物館', '図書館', '劇場', 'コンサートホール',
  '駅舎', 'ターミナル', '橋梁', '住宅', 'マンション', '集合住宅',
  'オフィスビル', '商業施設', 'ショッピングモール', '書店', '複合施設',
  '学校', '大学', '研究所', '病院', '教会', '寺院', '神社'
];

export const prefectures = [
  '東京都', '神奈川県', '千葉県', '埼玉県', '茨城県', '栃木県', '群馬県',
  '大阪府', '京都府', '兵庫県', '奈良県', '滋賀県', '和歌山県',
  '愛知県', '静岡県', '岐阜県', '三重県', '福岡県', '北海道', '沖縄県'
];

export const areas = [
  '港区', '渋谷区', '新宿区', '千代田区', '中央区', '品川区', '目黒区',
  '世田谷区', '杉並区', '中野区', '豊島区', '北区', '荒川区', '足立区',
  '葛飾区', '江戸川区', '台東区', '墨田区', '江東区', '文京区', '板橋区',
  '練馬区', '大田区', '津市', '伊勢市', '鈴鹿市'
]