import React, { memo, useMemo, useState } from 'react';
import { Activity, Monitor, Plane, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export type StreamStatus = 'connecting' | 'online' | 'offline' | 'error';
export type StreamType = 'drone' | 'camera' | 'sensor';

export interface StreamDevice {
  id: string;
  name: string;
  status: StreamStatus;
  type: StreamType;
  location?: string;
}

type FilterType = 'all' | 'drone' | 'camera' | 'sensor' | 'online' | 'offline';

interface StreamListProps {
  devices: StreamDevice[];
  selectedId?: string;
  onDeviceClick?: (id: string) => void;
  className?: string;
}

const groupMeta = {
  drone: { label: '无人机', icon: Plane },
  camera: { label: '摄像头', icon: Monitor },
  sensor: { label: '传感器', icon: Activity },
};

const statusMap: Record<StreamStatus, 'online' | 'offline' | 'alert' | 'pending'> = {
  connecting: 'pending',
  online: 'online',
  offline: 'offline',
  error: 'alert',
};

export const StreamList: React.FC<StreamListProps> = memo(
  ({ devices, selectedId, onDeviceClick, className }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredDevices = useMemo(() => {
      return devices.filter((device) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!device.name.toLowerCase().includes(query) && !device.location?.toLowerCase().includes(query)) {
            return false;
          }
        }

        if (filter === 'drone' && device.type !== 'drone') return false;
        if (filter === 'camera' && device.type !== 'camera') return false;
        if (filter === 'sensor' && device.type !== 'sensor') return false;
        if (filter === 'online' && device.status !== 'online') return false;
        if (filter === 'offline' && device.status !== 'offline') return false;

        return true;
      });
    }, [devices, filter, searchQuery]);

    const groupedDevices = useMemo(
      () =>
        (Object.keys(groupMeta) as StreamType[]).reduce(
          (groups, type) => ({
            ...groups,
            [type]: filteredDevices.filter((device) => device.type === type),
          }),
          {} as Record<StreamType, StreamDevice[]>,
        ),
      [filteredDevices],
    );

    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">设备清单</p>
              <p className="mt-2 text-sm text-text-secondary">按设备类型或状态筛选当前值守列表。</p>
            </div>
            <div className="rounded-full bg-bg-surface px-3 py-1 text-xs text-text-secondary">
              {devices.filter((device) => device.status === 'online').length}/{devices.length} 在线
            </div>
          </div>
          <div className="mt-4">
            <Input
              type="search"
              size="sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索设备或位置"
              prefix={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'online', label: '在线' },
              { value: 'offline', label: '离线' },
              { value: 'drone', label: '无人机' },
              { value: 'camera', label: '摄像头' },
              { value: 'sensor', label: '传感器' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value as FilterType)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
                  filter === option.value
                    ? 'bg-accent text-white shadow-panel'
                    : 'bg-bg-surface text-text-secondary hover:text-text-primary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-5">
            {(Object.keys(groupMeta) as StreamType[]).map((type) => {
              const Icon = groupMeta[type].icon;
              const items = groupedDevices[type] || [];

              if (!items.length) {
                return null;
              }

              return (
                <section key={type}>
                  <div className="mb-2 flex items-center gap-2 px-2">
                    <Icon className="h-4 w-4 text-text-tertiary" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                      {groupMeta[type].label}
                    </span>
                    <span className="text-xs text-text-tertiary">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((device) => (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => onDeviceClick?.(device.id)}
                        className={cn(
                          'w-full rounded-[18px] border px-3 py-3 text-left transition-all duration-normal',
                          selectedId === device.id
                            ? 'border-accent/30 bg-accent/10'
                            : 'border-transparent bg-bg-surface hover:border-border hover:bg-bg-light',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <StatusIndicator
                              status={statusMap[device.status]}
                              size="sm"
                              pulse={device.status === 'online'}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-primary">{device.name}</p>
                            <p className="mt-1 truncate text-xs text-text-secondary">{device.location || '未设置位置'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            {filteredDevices.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-border bg-bg-surface/60 px-4 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">没有匹配的设备</p>
                <p className="mt-2 text-sm text-text-secondary">调整搜索条件后，这里会重新展示设备列表。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

StreamList.displayName = 'StreamList';

export default StreamList;
