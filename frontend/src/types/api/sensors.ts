// =============================================================================
// Sensor Types - 传感器类型定义
// =============================================================================

/**
 * 传感器
 */
export interface Sensor {
  id: number;
  tenant_id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'gas' | 'smoke';
  location: string;
  status: 'online' | 'offline' | 'warning';
  last_value: number;
  unit: string;
  min_threshold: number;
  max_threshold: number;
  stream_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 传感器数据
 */
export interface SensorData {
  id: number;
  sensor_id: number;
  tenant_id: string;
  value: number;
  unit: string;
  created_at: string;
}

/**
 * 传感器数据响应
 */
export interface SensorDataResponse {
  sensor: Sensor;
  data: SensorData[];
  total: number;
}

/**
 * 传感器列表查询参数
 */
export interface SensorListParams {
  page?: number;
  page_size?: number;
  type?: string;
  status?: string;
}

/**
 * 创建传感器请求
 */
export interface CreateSensorRequest {
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'gas' | 'smoke';
  location?: string;
  unit?: string;
  min_threshold?: number;
  max_threshold?: number;
  stream_id?: number;
  description?: string;
}

/**
 * 更新传感器请求
 */
export interface UpdateSensorRequest {
  name?: string;
  type?: string;
  location?: string;
  status?: string;
  unit?: string;
  min_threshold?: number;
  max_threshold?: number;
  description?: string;
}