import { useState } from 'react';
import { Tag, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useDeleteAnnotationMutation, type AnnotationResponse } from '@/store/api/mediaApi';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnnotationOverlayProps {
  annotations: AnnotationResponse[];
  mediaWidth: number;
  mediaHeight: number;
  onDelete?: (id: number) => void;
}

const colors = [
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'blue' },
  { border: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'green' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'amber' },
  { border: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'red' },
  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'purple' },
];

function parseBBox(bboxStr: string | null): BBox | null {
  if (!bboxStr) return null;
  try {
    const arr = JSON.parse(bboxStr);
    if (Array.isArray(arr) && arr.length === 4) {
      return { x: arr[0], y: arr[1], width: arr[2], height: arr[3] };
    }
  } catch {
    // ignore
  }
  return null;
}

function parseTags(tagsStr: string | null): string[] {
  if (!tagsStr) return [];
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

export function AnnotationOverlay({ annotations, mediaWidth, mediaHeight, onDelete }: AnnotationOverlayProps) {
  const [deleteAnnotation] = useDeleteAnnotationMutation();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const regionAnnotations = annotations.filter((a) => a.annotation_type === 'region' && a.bbox);

  if (regionAnnotations.length === 0) return null;

  const handleDelete = async (id: number, mediaId: number) => {
    try {
      await deleteAnnotation({ id, mediaId }).unwrap();
      onDelete?.(id);
    } catch {
      // handled by RTK Query
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {regionAnnotations.map((ann, idx) => {
        const bbox = parseBBox(ann.bbox);
        if (!bbox) return null;

        const color = colors[idx % colors.length];
        const tags = parseTags(ann.tags);

        // Convert normalized coordinates to percentages
        const left = (bbox.x / mediaWidth) * 100;
        const top = (bbox.y / mediaHeight) * 100;
        const width = (bbox.width / mediaWidth) * 100;
        const height = (bbox.height / mediaHeight) * 100;

        return (
          <Tooltip
            key={ann.id}
            title={
              <div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {tags.map((tag) => (
                      <Tag key={tag} color={color.label}>{tag}</Tag>
                    ))}
                  </div>
                )}
                {ann.notes && <div className="text-xs text-slate-300">{ann.notes}</div>}
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(ann.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            }
          >
            <div
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                border: `2px solid ${color.border}`,
                backgroundColor: hoveredId === ann.id ? color.bg : 'transparent',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={() => setHoveredId(ann.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Label */}
              {tags.length > 0 && (
                <div
                  className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                  style={{ backgroundColor: color.border, color: '#fff' }}
                >
                  {tags[0]}
                </div>
              )}

              {/* Delete button */}
              {hoveredId === ann.id && (
                <button
                  className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ann.id, ann.media_id);
                  }}
                >
                  <DeleteOutlined />
                </button>
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
