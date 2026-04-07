import { Cpu, HardDrive, Activity, Database, Clock, Download, RefreshCw, FileText, Server, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingCard } from '../../components/SettingCard';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const SystemInfoSection: React.FC = () => {
  const systemInfo = {
    version: 'v1.0.0',
    buildTime: '2026-04-07 14:30:00',
    uptime: 72 * 3600 * 1000,
    resources: {
      cpu: 45,
      memory: 68,
      disk: 32
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} 天 ${hours % 24} 小时`;
    if (hours > 0) return `${hours} 小时 ${minutes % 60} 分钟`;
    return `${minutes} 分钟`;
  };

  const getResourceColor = (percent: number) => {
    if (percent > 80) return 'text-error';
    if (percent > 60) return 'text-warning';
    return 'text-success';
  };

  const getResourceBgColor = (percent: number) => {
    if (percent > 80) return 'bg-error';
    if (percent > 60) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">系统信息</h1>
          <p className="text-text-secondary">查看系统版本和资源使用情况</p>
        </div>
        <Button variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <SettingCard title="版本信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">版本号</span>
              <Badge status="info" className="font-mono">
                {systemInfo.version}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">构建时间</span>
              <span className="text-sm font-medium text-text-primary">
                {systemInfo.buildTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">运行时间</span>
              <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatUptime(systemInfo.uptime)}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-accent-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-text-primary mb-2">更新日志</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• 新增设置模块</li>
                <li>• 优化YOLO检测性能</li>
                <li>• 修复告警通知问题</li>
              </ul>
            </div>
            <Button variant="secondary" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              查看完整更新日志
            </Button>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="资源监控">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-text-primary">CPU 使用率</span>
              </div>
              <span className={cn('text-lg font-semibold', getResourceColor(systemInfo.resources.cpu))}>
                {systemInfo.resources.cpu}%
              </span>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div 
                className={cn('h-2 rounded-full transition-all duration-500', getResourceBgColor(systemInfo.resources.cpu))}
                style={{ width: `${systemInfo.resources.cpu}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-text-primary">内存使用率</span>
              </div>
              <span className={cn('text-lg font-semibold', getResourceColor(systemInfo.resources.memory))}>
                {systemInfo.resources.memory}%
              </span>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div 
                className={cn('h-2 rounded-full transition-all duration-500', getResourceBgColor(systemInfo.resources.memory))}
                style={{ width: `${systemInfo.resources.memory}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-text-primary">磁盘使用率</span>
              </div>
              <span className={cn('text-lg font-semibold', getResourceColor(systemInfo.resources.disk))}>
                {systemInfo.resources.disk}%
              </span>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div 
                className={cn('h-2 rounded-full transition-all duration-500', getResourceBgColor(systemInfo.resources.disk))}
                style={{ width: `${systemInfo.resources.disk}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-bg-primary rounded-lg border border-border text-center">
              <Database className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-text-secondary">数据库连接</p>
              <Badge className="mt-1 bg-success/10 text-success">正常</Badge>
            </div>
            <div className="p-4 bg-bg-primary rounded-lg border border-border text-center">
              <Server className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-text-secondary">Redis 状态</p>
              <Badge className="mt-1 bg-success/10 text-success">正常</Badge>
            </div>
            <div className="p-4 bg-bg-primary rounded-lg border border-border text-center">
              <Activity className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-text-secondary">AI 服务</p>
              <Badge className="mt-1 bg-success/10 text-success">正常</Badge>
            </div>
            <div className="p-4 bg-bg-primary rounded-lg border border-border text-center">
              <Zap className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-text-secondary">YOLO 服务</p>
              <Badge className="mt-1 bg-success/10 text-success">正常</Badge>
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="日志查看">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select className="bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary">
                <option>全部级别</option>
                <option>ERROR</option>
                <option>WARNING</option>
                <option>INFO</option>
                <option>DEBUG</option>
              </select>
              <select className="bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary">
                <option>最近 1 小时</option>
                <option>最近 6 小时</option>
                <option>最近 24 小时</option>
                <option>最近 7 天</option>
              </select>
            </div>
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              导出日志
            </Button>
          </div>

          <div className="bg-bg-primary rounded-lg border border-border p-4 font-mono text-sm max-h-64 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex gap-3">
                <span className="text-text-tertiary">2026-04-07 14:30:15</span>
                <Badge className="bg-success/10 text-success">INFO</Badge>
                <span className="text-text-primary">系统启动完成</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-tertiary">2026-04-07 14:30:12</span>
                <Badge className="bg-success/10 text-success">INFO</Badge>
                <span className="text-text-primary">YOLO 模型加载成功: yolov8-fire-v1.2.0</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-tertiary">2026-04-07 14:28:45</span>
                <Badge className="bg-warning/10 text-warning">WARNING</Badge>
                <span className="text-text-primary">检测到内存使用率超过 60%</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-tertiary">2026-04-07 14:25:00</span>
                <Badge className="bg-success/10 text-success">INFO</Badge>
                <span className="text-text-primary">告警规则 "火灾检测" 已触发</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-tertiary">2026-04-07 14:20:30</span>
                <Badge className="bg-success/10 text-success">INFO</Badge>
                <span className="text-text-primary">用户 admin 登录系统</span>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="数据备份">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">自动备份</p>
              <p className="text-xs text-text-secondary">每日凌晨 2 点自动备份数据库和配置</p>
            </div>
            <Button>
              <Database className="w-4 h-4 mr-2" />
              立即备份
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary">备份历史</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">backup_20260407_020000.zip</p>
                    <p className="text-xs text-text-secondary">2026-04-07 02:00:00 · 256 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">backup_20260406_020000.zip</p>
                    <p className="text-xs text-text-secondary">2026-04-06 02:00:00 · 254 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};

export { SystemInfoSection };
