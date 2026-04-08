import React, { useState } from 'react';
import { X, Lock, Unlock, Trash2, UserPlus, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { FolderItem, FolderPermission } from '@/types/api/media';
import {
  useListFolderPermissionsQuery,
  useGrantFolderPermissionMutation,
  useUpdateFolderPermissionMutation,
  useRevokeFolderPermissionMutation,
  useSetFolderPublicMutation,
} from '@/store/api/mediaApi';

interface PermissionPanelProps {
  folder: FolderItem;
  onClose: () => void;
  onFolderUpdated?: () => void;
}

const permissionLabels: Record<string, string> = {
  read: '只读',
  write: '读写',
  admin: '管理',
};

const permissionColors: Record<string, string> = {
  read: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  write: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export const PermissionPanel: React.FC<PermissionPanelProps> = ({ folder, onClose, onFolderUpdated }) => {
  const [userIdInput, setUserIdInput] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [addError, setAddError] = useState('');

  const { data: permissionsData, isLoading, refetch } = useListFolderPermissionsQuery(folder.id);

  const [grantPermission, { isLoading: isGranting }] = useGrantFolderPermissionMutation();
  const [updatePermission] = useUpdateFolderPermissionMutation();
  const [revokePermission, { isLoading: isRevoking }] = useRevokeFolderPermissionMutation();
  const [setPublic, { isLoading: isSettingPublic }] = useSetFolderPublicMutation();

  const permissions: FolderPermission[] = permissionsData?.data || [];

  const handleGrant = async () => {
    const userId = parseInt(userIdInput, 10);
    if (isNaN(userId) || userId <= 0) {
      setAddError('请输入有效的用户ID');
      return;
    }
    setAddError('');
    try {
      await grantPermission({ folderId: folder.id, body: { user_id: userId, permission: 'read' } }).unwrap();
      setUserIdInput('');
      setShowAddUser(false);
      refetch();
    } catch (error) {
      console.error('Failed to grant permission:', error);
      setAddError('授权失败，请检查用户ID');
    }
  };

  const handleUpdate = async (userId: number, permission: string) => {
    try {
      await updatePermission({
        folderId: folder.id,
        userId,
        body: { permission: permission as 'read' | 'write' | 'admin' },
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleRevoke = async (userId: number) => {
    if (!confirm('确定要移除该用户的访问权限吗？')) return;
    try {
      await revokePermission({ folderId: folder.id, userId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await setPublic({
        folderId: folder.id,
        body: { is_public: !folder.is_private },
      }).unwrap();
      onFolderUpdated?.();
      onClose();
    } catch (error) {
      console.error('Failed to set folder public:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">文件夹权限</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Folder Info & Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary">
            <div className="flex items-center gap-3">
              {folder.is_private ? (
                <Lock className="w-5 h-5 text-yellow-500" />
              ) : (
                <Unlock className="w-5 h-5 text-green-500" />
              )}
              <div>
                <div className="font-medium text-text-primary">{folder.name}</div>
                <div className="text-sm text-text-secondary">
                  {folder.is_private ? '私有文件夹' : '公开文件夹（租户内所有人可读）'}
                </div>
              </div>
            </div>
            <Button
              variant={folder.is_private ? 'outline' : 'primary'}
              size="sm"
              onClick={handleTogglePublic}
              disabled={isSettingPublic}
            >
              {folder.is_private ? '设为公开' : '设为私有'}
            </Button>
          </div>

          {/* Permission Description */}
          <div className="text-sm text-text-secondary space-y-1">
            <p>• <strong>只读</strong>：可以查看和下载文件</p>
            <p>• <strong>读写</strong>：可以上传、编辑、删除文件</p>
            <p>• <strong>管理</strong>：可以管理权限和分享设置</p>
            <p className="pt-2 text-text-disabled">提示：创建者拥有管理权限，无法被移除</p>
          </div>

          {/* Permissions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">已授权用户</h3>
              <span className="text-sm text-text-secondary">{permissions.length} 人</span>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-text-secondary">加载中...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                暂无其他用户有权限（创建者拥有管理权限）
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.user_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary"
                  >
                    <Avatar className="w-8 h-8" fallback={perm.user?.username?.charAt(0).toUpperCase() || <Shield className="w-4 h-4" />} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {perm.user?.username || `用户 ${perm.user_id}`}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {perm.user?.email || ''}
                      </div>
                    </div>
                    <Badge className={permissionColors[perm.permission]}>
                      {permissionLabels[perm.permission]}
                    </Badge>
                    {perm.permission !== 'admin' && (
                      <select
                        value={perm.permission}
                        onChange={(e) => handleUpdate(perm.user_id, e.target.value)}
                        className="px-2 py-1 text-sm rounded-lg border border-border bg-bg-primary text-text-primary"
                      >
                        <option value="read">只读</option>
                        <option value="write">读写</option>
                        <option value="admin">管理</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleRevoke(perm.user_id)}
                      disabled={isRevoking}
                      className="p-2 rounded-xl hover:bg-error/10 text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add User by ID */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              添加用户
              <ChevronDown className={`w-4 h-4 transition-transform ${showAddUser ? 'rotate-180' : ''}`} />
            </button>

            {showAddUser && (
              <div className="space-y-3 p-4 rounded-xl bg-bg-secondary">
                <div className="text-sm text-text-secondary">
                  输入用户ID授权访问此文件夹
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="输入用户ID"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGrant}
                    disabled={isGranting || !userIdInput}
                  >
                    {isGranting ? '添加中...' : '添加'}
                  </Button>
                </div>
                {addError && (
                  <div className="text-sm text-error">{addError}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionPanel;
