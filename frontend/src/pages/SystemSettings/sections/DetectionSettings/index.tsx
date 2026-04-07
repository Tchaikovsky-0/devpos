import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { SettingCard } from '../../components/SettingCard';
import { AdvancedToggle } from '../../components/AdvancedToggle';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import type { RootState } from '@/store';
import { updateDetectionSettings } from '@/store/settingsSlice';
import { cn } from '@/lib/utils';

const modelTypeLabels: Record<string, string> = {
  fire: '火灾',
  intrusion: '入侵',
  crack: '裂缝',
  smoke: '烟雾',
  vehicle: '车辆',
};

const modelTypeColors: Record<string, string> = {
  fire: 'bg-error-muted text-error',
  intrusion: 'bg-warning-muted text-warning',
  crack: 'bg-info-muted text-info',
  smoke: 'bg-accent-muted text-accent',
  vehicle: 'bg-success-muted text-success',
};

export const DetectionSettingsSection: React.FC = () => {
  const dispatch = useDispatch();
  const detectionSettings = useSelector((state: RootState) => state.settings.detection);

  const handleToggleModel = (id: string) => {
    const updatedModels = detectionSettings.models.map((model) =>
      model.id === id ? { ...model, enabled: !model.enabled } : model
    );
    dispatch(updateDetectionSettings({ models: updatedModels }));
  };

  const handleConfidenceChange = (value: number) => {
    dispatch(updateDetectionSettings({ confidenceThreshold: value }));
  };

  const handleDebounceChange = (value: number) => {
    dispatch(updateDetectionSettings({ debounceFrames: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">检测设置</h1>
        <p className="text-text-secondary">配置 YOLO 检测模型和参数</p>
      </div>

      <SettingCard 
        title="检测模型" 
        description="选择要启用的 AI 检测模型"
      >
        <div className="space-y-3">
          {detectionSettings.models.map((model) => (
            <div
              key={model.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all',
                model.enabled
                  ? 'border-border bg-bg-primary'
                  : 'border-border bg-bg-tertiary/30 opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-md flex items-center justify-center',
                  modelTypeColors[model.type]
                )}>
                  {model.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">{model.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      modelTypeColors[model.type]
                    )}>
                      {modelTypeLabels[model.type]}
                    </span>
                    <span className="text-xs text-text-secondary">
                      版本: {model.version}
                    </span>
                  </div>
                </div>
              </div>
              <Switch
                checked={model.enabled}
                onCheckedChange={() => handleToggleModel(model.id)}
              />
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard 
        title="检测参数" 
        description="调整检测的灵敏度和准确性"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">置信度阈值</label>
              <span className="text-sm text-accent font-mono">{(detectionSettings.confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={detectionSettings.confidenceThreshold}
              onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between mt-1 text-xs text-text-tertiary">
              <span>低 (10%)</span>
              <span>高 (90%)</span>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              阈值越高，误报越少，但可能漏报；阈值越低，检测越敏感，但误报可能增加
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">防抖帧数</label>
              <span className="text-sm text-accent font-mono">{detectionSettings.debounceFrames} 帧</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={detectionSettings.debounceFrames}
              onChange={(e) => handleDebounceChange(parseInt(e.target.value))}
              className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between mt-1 text-xs text-text-tertiary">
              <span>1 帧</span>
              <span>10 帧</span>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              连续检测到 N 帧才触发告警，减少瞬间误报
            </p>
          </div>
        </div>

        <AdvancedToggle>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">检测区域 (ROI)</h4>
              <Button variant="ghost">
                <RefreshCw className="w-4 h-4 mr-2" />
                配置检测区域
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">输入尺寸</h4>
              <select className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm">
                <option value="640">640 × 640 (平衡)</option>
                <option value="416">416 × 416 (快速)</option>
                <option value="1024">1024 × 1024 (精确)</option>
              </select>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">NMS 阈值</h4>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                defaultValue="0.45"
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        </AdvancedToggle>
      </SettingCard>
    </div>
  );
};
