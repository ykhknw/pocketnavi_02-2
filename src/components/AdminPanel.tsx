import React, { useState } from 'react';
import { Plus, Edit, Trash2, Upload, Download, Database } from 'lucide-react';
import { getRandomDefaultImage } from '../utils/pexels';
import { Building } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { t } from '../utils/translations';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: Building[];
  onAddBuilding: (building: Partial<Building>) => void;
  onUpdateBuilding: (id: number, building: Partial<Building>) => void;
  onDeleteBuilding: (id: number) => void;
  language: 'ja' | 'en';
}

export function AdminPanel({
  isOpen,
  onClose,
  buildings,
  onAddBuilding,
  onUpdateBuilding,
  onDeleteBuilding,
  language
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'buildings' | 'import' | 'export'>('buildings');
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    completionYears: new Date().getFullYear(),
    location: '',
    architectDetails: '',
    buildingTypes: '',
    structures: '',
    prefectures: '',
    areas: '',
    lat: 35.6762,
    lng: 139.6503,
    thumbnailUrl: '',
    youtubeUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const buildingData = {
      ...formData,
      buildingTypes: formData.buildingTypes.split(',').map(s => s.trim()),
      structures: formData.structures.split(',').map(s => s.trim()),
      parentBuildingTypes: [],
      parentStructures: [],
      architects: [],
      photos: [],
      likes: 0,
      uid: `building_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingBuilding) {
      onUpdateBuilding(editingBuilding.id, buildingData);
      setEditingBuilding(null);
    } else {
      onAddBuilding(buildingData);
      setShowAddForm(false);
    }

    setFormData({
      title: '',
      titleEn: '',
      completionYears: new Date().getFullYear(),
      location: '',
      architectDetails: '',
      buildingTypes: '',
      structures: '',
      prefectures: '',
      areas: '',
      lat: 35.6762,
      lng: 139.6503,
      thumbnailUrl: '',
      youtubeUrl: ''
    });
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      title: building.title,
      titleEn: building.titleEn,
      completionYears: building.completionYears,
      location: building.location,
      architectDetails: building.architectDetails,
      buildingTypes: building.buildingTypes.join(', '),
      structures: building.structures.join(', '),
      prefectures: building.prefectures,
      areas: building.areas,
      lat: building.lat,
      lng: building.lng,
      thumbnailUrl: building.thumbnailUrl,
      youtubeUrl: building.youtubeUrl
    });
    setShowAddForm(true);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(buildings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'buildings-export.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('adminPanel', language)}</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="flex border-b mb-6">
            <Button
              variant={activeTab === 'buildings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('buildings')}
            >
              {t('buildingManagement', language)}
            </Button>
            <Button
              variant={activeTab === 'import' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('import')}
            >
              {t('import', language)}
            </Button>
            <Button
              variant={activeTab === 'export' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('export')}
            >
              {t('export', language)}
            </Button>
          </div>

          {activeTab === 'buildings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('buildingList', language)} ({buildings.length}{language === 'ja' ? '件' : ' items'})
                </h3>
                <Button
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t('addNew', language)}
                </Button>
              </div>

              {(showAddForm || editingBuilding) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>
                      {editingBuilding ? t('edit', language) : t('addNew', language)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium mb-1">
                        建築物名
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="titleEn" className="text-sm font-medium mb-1">
                        英語名
                      </Label>
                      <Input
                        id="titleEn"
                        type="text"
                        value={formData.titleEn}
                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="completionYears" className="text-sm font-medium mb-1">
                        完成年
                      </Label>
                      <Input
                        id="completionYears"
                        type="number"
                        required
                        value={formData.completionYears}
                        onChange={(e) => setFormData({ ...formData, completionYears: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="prefectures" className="text-sm font-medium mb-1">
                        都道府県
                      </Label>
                      <Input
                        id="prefectures"
                        type="text"
                        required
                        value={formData.prefectures}
                        onChange={(e) => setFormData({ ...formData, prefectures: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="location" className="text-sm font-medium mb-1">
                        住所
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="buildingTypes" className="text-sm font-medium mb-1">
                        建築種別 (カンマ区切り)
                      </Label>
                      <Input
                        id="buildingTypes"
                        type="text"
                        value={formData.buildingTypes}
                        onChange={(e) => setFormData({ ...formData, buildingTypes: e.target.value })}
                        placeholder="美術館, ギャラリー"
                      />
                    </div>

                    <div>
                      <Label htmlFor="structures" className="text-sm font-medium mb-1">
                        構造 (カンマ区切り)
                      </Label>
                      <Input
                        id="structures"
                        type="text"
                        value={formData.structures}
                        onChange={(e) => setFormData({ ...formData, structures: e.target.value })}
                        placeholder="RC造, 鉄骨造"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lat" className="text-sm font-medium mb-1">
                        緯度
                      </Label>
                      <Input
                        id="lat"
                        type="number"
                        step="0.000001"
                        required
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lng" className="text-sm font-medium mb-1">
                        経度
                      </Label>
                      <Input
                        id="lng"
                        type="number"
                        step="0.000001"
                        required
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="thumbnailUrl" className="text-sm font-medium mb-1">
                        画像URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="thumbnailUrl"
                          type="url"
                          value={formData.thumbnailUrl}
                          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                          placeholder="画像URLを入力するか、ランダム画像ボタンを使用"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, thumbnailUrl: getRandomDefaultImage() })}
                        >
                          ランダム画像
                        </Button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="youtubeUrl" className="text-sm font-medium mb-1">
                        YouTube URL
                      </Label>
                      <Input
                        id="youtubeUrl"
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="architectDetails" className="text-sm font-medium mb-1">
                        詳細説明
                      </Label>
                      <textarea
                        id="architectDetails"
                        value={formData.architectDetails}
                        onChange={(e) => setFormData({ ...formData, architectDetails: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <Button
                        type="submit"
                      >
                        {editingBuilding ? t('update', language) : t('add', language)}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingBuilding(null);
                          setFormData({
                            title: '',
                            titleEn: '',
                            completionYears: new Date().getFullYear(),
                            location: '',
                            architectDetails: '',
                            buildingTypes: '',
                            structures: '',
                            prefectures: '',
                            areas: '',
                            lat: 35.6762,
                            lng: 139.6503,
                            thumbnailUrl: '',
                            youtubeUrl: ''
                          });
                        }}
                      >
                        {t('cancel', language)}
                      </Button>
                    </div>
                  </form>
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>建築物名</TableHead>
                    <TableHead>完成年</TableHead>
                    <TableHead>所在地</TableHead>
                    <TableHead>いいね</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {buildings.map(building => (
                    <TableRow key={building.id}>
                      <TableCell>
                          <div className="font-medium">{building.title}</div>
                        <div className="text-sm text-muted-foreground">{building.titleEn}</div>
                      </TableCell>
                      <TableCell>{building.completionYears}</TableCell>
                      <TableCell>{building.location}</TableCell>
                      <TableCell>{building.likes}</TableCell>
                      <TableCell>
                          <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                              onClick={() => handleEdit(building)}
                            className="text-primary hover:text-primary/80"
                            >
                              <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                              onClick={() => onDeleteBuilding(building.id)}
                            className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">データインポート</h3>
              <Card>
                <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  JSONファイルをドラッグ&ドロップするか、ファイルを選択してください
                </p>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="import-file"
                />
                <Button asChild>
                  <label
                  htmlFor="import-file"
                  className="cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  ファイルを選択
                </label>
                </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">データエクスポート</h3>
              <div className="space-y-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                  <Database className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">建築物データ</h4>
                    <p className="text-sm text-muted-foreground">
                      現在の建築物データを JSON 形式でエクスポートします
                    </p>
                  </div>
                  <Button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    エクスポート
                  </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}