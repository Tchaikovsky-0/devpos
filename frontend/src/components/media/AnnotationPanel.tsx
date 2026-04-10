import { useState } from 'react';
import { Tag, Input, Button, Space, Select, message, Tooltip } from 'antd';
import { PlusOutlined, TagOutlined, EditFilled, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCreateAnnotationMutation, useDeleteAnnotationMutation, useListAnnotationsQuery } from '@/store/api/mediaApi';

const { TextArea } = Input;

type AnnotationType = 'tag' | 'region' | 'note';

interface AnnotationPanelProps {
  mediaId: number;
}

const typeColors: Record<AnnotationType, string> = {
  tag: 'blue',
  region: 'green',
  note: 'orange',
};

const typeIcons: Record<AnnotationType, React.ReactNode> = {
  tag: <TagOutlined />,
  region: <EditFilled />,
  note: <FileTextOutlined />,
};

export function AnnotationPanel({ mediaId }: AnnotationPanelProps) {
  const { data: annotationsData, isLoading, refetch } = useListAnnotationsQuery(mediaId, { skip: !mediaId });
  const [createAnnotation] = useCreateAnnotationMutation();
  const [deleteAnnotation] = useDeleteAnnotationMutation();

  const [newType, setNewType] = useState<AnnotationType>('tag');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const annotations = annotationsData?.data ?? [];

  const handleAddTag = () => {
    if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
      setNewTags([...newTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (newType === 'tag' && newTags.length === 0 && !newNotes.trim()) {
      message.warning('请添加标签或备注');
      return;
    }

    try {
      await createAnnotation({
        media_id: mediaId,
        annotation_type: newType,
        tags: newTags.length > 0 ? newTags : undefined,
        notes: newNotes.trim() || undefined,
        content: JSON.stringify({ tags: newTags, notes: newNotes }),
      }).unwrap();
      message.success('标注已添加');
      setNewTags([]);
      setNewNotes('');
      setShowForm(false);
      refetch();
    } catch {
      message.error('添加标注失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAnnotation({ id, mediaId }).unwrap();
      message.success('标注已删除');
      refetch();
    } catch {
      message.error('删除标注失败');
    }
  };

  const parseTags = (tagsStr: string | null): string[] => {
    if (!tagsStr) return [];
    try {
      return JSON.parse(tagsStr);
    } catch {
      return [];
    }
  };

  if (!mediaId) {
    return (
      <div className="p-4 text-center text-slate-500">
        请选择一个媒体文件进行标注
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <span className="text-sm font-medium text-white">人工标注</span>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setShowForm(!showForm)}
        >
          添加
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-3 border-b border-white/10 bg-white/5">
          <Space direction="vertical" className="w-full" size="middle">
            <Select
              value={newType}
              onChange={(v: 'tag' | 'region' | 'note') => setNewType(v)}
              className="w-full"
              options={[
                { value: 'tag', label: '标签', icon: <TagOutlined /> },
                { value: 'region', label: '区域', icon: <EditFilled /> },
                { value: 'note', label: '备注', icon: <FileTextOutlined /> },
              ]}
            />

            {(newType === 'tag' || newType === 'region') && (
              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {newTags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      color={typeColors[newType]}
                      onClose={() => handleRemoveTag(tag)}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
                <Input
                  size="small"
                  value={newTagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagInput(e.target.value)}
                  onPressEnter={handleAddTag}
                  placeholder="输入标签后按回车"
                />
              </div>
            )}

            <TextArea
              value={newNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNotes(e.target.value)}
              placeholder="添加备注说明..."
              rows={3}
              maxLength={500}
              showCount
            />

            <div className="flex justify-end gap-2">
              <Button size="small" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button type="primary" size="small" onClick={handleSubmit}>
                保存
              </Button>
            </div>
          </Space>
        </div>
      )}

      {/* Annotation List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">加载中...</div>
        ) : annotations.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <TagOutlined className="text-3xl mb-2 block" />
            <div>暂无标注</div>
            <div className="text-xs mt-1">点击"添加"开始标注</div>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map((ann) => {
              const tags = parseTags(ann.tags);
              return (
                <div
                  key={ann.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Tooltip title={ann.annotation_type}>
                      <Tag color={typeColors[ann.annotation_type as AnnotationType]}>
                        {typeIcons[ann.annotation_type as AnnotationType]}
                        <span className="ml-1">{ann.annotation_type}</span>
                      </Tag>
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(ann.id)}
                      />
                    </Tooltip>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tags.map((tag) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </div>
                  )}

                  {ann.notes && (
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                      {ann.notes}
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(ann.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
