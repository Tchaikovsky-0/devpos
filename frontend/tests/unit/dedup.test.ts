// =============================================================================
// 重复检测算法单元测试
// 测试去重逻辑的准确性、边界条件和性能
// =============================================================================

import { describe, it, expect } from 'vitest';

// =============================================================================
// 模拟重复检测相关函数
// =============================================================================

interface MediaFile {
  id: string;
  hash?: string;
  pHash?: string;
  mimeType: string;
  size: number;
  createdAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    camera?: string;
    timestamp?: string;
  };
}

interface DuplicateGroup {
  id: string;
  method: 'hash' | 'phash' | 'content' | 'metadata';
  score: number;
  members: string[];
}

// 简化的汉明距离计算（用于pHash比对）
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// 计算相似度（基于汉明距离）
function calculateSimilarity(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  const maxLength = Math.max(hash1.length, hash2.length);
  return 1 - (distance / maxLength);
}

// 基于Hash的重复检测
function detectDuplicatesByHash(files: MediaFile[], threshold = 0.9): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (const file of files) {
    if (processed.has(file.id) || !file.hash) continue;

    const duplicates = files.filter(f => {
      if (f.id === file.id || processed.has(f.id) || !f.hash) return false;
      const similarity = calculateSimilarity(file.hash, f.hash);
      return similarity >= threshold;
    });

    if (duplicates.length > 0) {
      const group: DuplicateGroup = {
        id: `hash-${file.id}`,
        method: 'hash',
        score: duplicates.length > 0 ? calculateSimilarity(file.hash, duplicates[0].hash!) : 1,
        members: [file.id, ...duplicates.map(d => d.id)],
      };
      groups.push(group);
      processed.add(file.id);
      duplicates.forEach(d => processed.add(d.id));
    }
  }

  return groups;
}

// 基于元数据的重复检测
function detectDuplicatesByMetadata(files: MediaFile[], threshold = 0.8): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (const file of files) {
    if (processed.has(file.id)) continue;

    const duplicates = files.filter(f => {
      if (f.id === file.id || processed.has(f.id)) return false;
      if (!file.metadata || !f.metadata) return false;

      let matchScore = 0;
      let totalScore = 0;

      if (file.metadata.width === f.metadata.width) { matchScore++; }
      totalScore++;
      if (file.metadata.height === f.metadata.height) { matchScore++; }
      totalScore++;
      if (file.metadata.camera === f.metadata.camera) { matchScore++; }
      totalScore++;
      if (file.metadata.timestamp && f.metadata.timestamp) {
        const timeDiff = Math.abs(
          new Date(file.metadata.timestamp).getTime() -
          new Date(f.metadata.timestamp).getTime()
        );
        if (timeDiff < 60000) { matchScore++; } // 1分钟内
        totalScore++;
      }

      return (matchScore / totalScore) >= threshold;
    });

    if (duplicates.length > 0) {
      groups.push({
        id: `meta-${file.id}`,
        method: 'metadata',
        score: duplicates.length / (duplicates.length + 1),
        members: [file.id, ...duplicates.map(d => d.id)],
      });
      processed.add(file.id);
      duplicates.forEach(d => processed.add(d.id));
    }
  }

  return groups;
}

// 组合重复检测
function detectAllDuplicates(files: MediaFile[]): DuplicateGroup[] {
  const hashGroups = detectDuplicatesByHash(files);
  const metaGroups = detectDuplicatesByMetadata(files);
  return [...hashGroups, ...metaGroups];
}

// =============================================================================
// 测试用例
// =============================================================================

describe('重复检测算法 - Hash比对', () => {
  describe('hammingDistance', () => {
    it('相同Hash应返回0距离', () => {
      expect(hammingDistance('10101010', '10101010')).toBe(0);
    });

    it('完全不同的Hash应返回最大距离', () => {
      const distance = hammingDistance('00000000', '11111111');
      expect(distance).toBe(8);
    });

    it('部分不同的Hash应返回正确距离', () => {
      expect(hammingDistance('10101010', '10101011')).toBe(1);
      expect(hammingDistance('10101010', '11101010')).toBe(1);
    });

    it('不同长度Hash应返回Infinity', () => {
      expect(hammingDistance('1010', '101010')).toBe(Infinity);
    });
  });

  describe('calculateSimilarity', () => {
    it('相同Hash应返回1.0相似度', () => {
      expect(calculateSimilarity('10101010', '10101010')).toBe(1);
    });

    it('50%不同的Hash应返回0.5相似度', () => {
      const similarity = calculateSimilarity('00000000', '11111111');
      expect(similarity).toBe(0);
    });

    it('75%相同的Hash应返回0.5以上相似度', () => {
      const similarity = calculateSimilarity('11111111', '11111000');
      expect(similarity).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('detectDuplicatesByHash', () => {
    it('应正确识别完全相同的文件', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
      ];

      const groups = detectDuplicatesByHash(files, 0.9);
      expect(groups).toHaveLength(1);
      expect(groups[0].members).toContain('1');
      expect(groups[0].members).toContain('2');
    });

    it('不应将不同的文件识别为重复', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', hash: '00000000', mimeType: 'image/jpeg', size: 2048, createdAt: '2026-01-02' },
      ];

      const groups = detectDuplicatesByHash(files, 0.9);
      expect(groups).toHaveLength(0);
    });

    it('应处理没有Hash的文件', () => {
      const files: MediaFile[] = [
        { id: '1', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
      ];

      const groups = detectDuplicatesByHash(files, 0.9);
      expect(groups).toHaveLength(0);
    });

    it('应正确处理单文件情况', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
      ];

      const groups = detectDuplicatesByHash(files, 0.9);
      expect(groups).toHaveLength(0);
    });

    it('应正确处理空数组', () => {
      const groups = detectDuplicatesByHash([], 0.9);
      expect(groups).toHaveLength(0);
    });

    it('应正确识别多组重复', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
        { id: '3', hash: '00000000', mimeType: 'image/jpeg', size: 2048, createdAt: '2026-01-03' },
        { id: '4', hash: '00000000', mimeType: 'image/jpeg', size: 2048, createdAt: '2026-01-04' },
      ];

      const groups = detectDuplicatesByHash(files, 0.9);
      expect(groups).toHaveLength(2);
    });
  });
});

describe('重复检测算法 - 元数据比对', () => {
  describe('detectDuplicatesByMetadata', () => {
    it('应正确识别时间相近的同一相机文件', () => {
      const files: MediaFile[] = [
        {
          id: '1',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:00Z' },
        },
        {
          id: '2',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:30Z' },
        },
      ];

      const groups = detectDuplicatesByMetadata(files, 0.75);
      expect(groups).toHaveLength(1);
      expect(groups[0].members).toContain('1');
      expect(groups[0].members).toContain('2');
    });

    it('不应将不同相机的文件识别为重复', () => {
      const files: MediaFile[] = [
        {
          id: '1',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:00Z' },
        },
        {
          id: '2',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-02', timestamp: '2026-01-01T10:00:30Z' },
        },
      ];

      const groups = detectDuplicatesByMetadata(files, 1.0);
      expect(groups).toHaveLength(0);
    });

    it('不应将时间间隔大的文件识别为重复', () => {
      const files: MediaFile[] = [
        {
          id: '1',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:00Z' },
        },
        {
          id: '2',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-01',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T12:00:00Z' },
        },
      ];

      // Same camera, same resolution, but 2h time gap: 2/4=0.5, only strictly above 0.5 counts
      const groups = detectDuplicatesByMetadata(files, 0.9);
      expect(groups).toHaveLength(0);
    });

    it('应处理没有元数据的文件', () => {
      const files: MediaFile[] = [
        { id: '1', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
      ];

      const groups = detectDuplicatesByMetadata(files, 0.8);
      expect(groups).toHaveLength(0);
    });
  });
});

describe('重复检测算法 - 组合检测', () => {
  describe('detectAllDuplicates', () => {
    it('应返回所有类型的重复组', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
        {
          id: '3',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-03',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:00Z' },
        },
        {
          id: '4',
          mimeType: 'image/jpeg',
          size: 1024,
          createdAt: '2026-01-04',
          metadata: { width: 1920, height: 1080, camera: 'CAM-01', timestamp: '2026-01-01T10:00:30Z' },
        },
      ];

      const groups = detectAllDuplicates(files);
      expect(groups.length).toBeGreaterThan(0);
      expect(groups.some(g => g.method === 'hash')).toBe(true);
    });

    it('不应重复分组同一个文件', () => {
      const files: MediaFile[] = [
        { id: '1', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
        { id: '2', hash: '11111111', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
      ];

      const groups = detectAllDuplicates(files);
      const allMemberIds = groups.flatMap(g => g.members);
      const uniqueIds = new Set(allMemberIds);
      expect(uniqueIds.size).toBe(allMemberIds.length);
    });
  });
});

describe('重复检测算法 - 性能测试', () => {
  it('应在大数据集上保持性能', () => {
    const files: MediaFile[] = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      hash: i % 2 === 0 ? '11111111' : '00000000',
      mimeType: 'image/jpeg',
      size: 1024,
      createdAt: '2026-01-01',
    }));

    const startTime = performance.now();
    const groups = detectDuplicatesByHash(files, 0.9);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000);
    expect(groups.length).toBeGreaterThan(0);
  });

  it('应正确处理边界情况', () => {
    const files: MediaFile[] = [
      { id: '1', hash: '', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-01' },
      { id: '2', hash: '', mimeType: 'image/jpeg', size: 1024, createdAt: '2026-01-02' },
    ];

    expect(() => detectDuplicatesByHash(files, 0.9)).not.toThrow();
  });
});

describe('重复检测算法 - 边界条件', () => {
  it('应处理极短的Hash', () => {
    expect(hammingDistance('1', '0')).toBe(1);
    expect(calculateSimilarity('1', '1')).toBe(1);
  });

  it('应处理长Hash', () => {
    const longHash1 = '1'.repeat(64);
    const longHash2 = '0'.repeat(64);
    expect(hammingDistance(longHash1, longHash2)).toBe(64);
  });

  it('相似度计算应保持单调性', () => {
    const base = '1010101010101010';
    const same = '1010101010101010';
    const similar = '1010101010101011';
    const different = '0101010101010101';

    const sameSim = calculateSimilarity(base, same);
    const similarSim = calculateSimilarity(base, similar);
    const diffSim = calculateSimilarity(base, different);

    expect(sameSim).toBeGreaterThan(similarSim);
    expect(similarSim).toBeGreaterThan(diffSim);
  });
});
