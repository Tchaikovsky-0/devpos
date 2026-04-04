import { apiClient } from '../client';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  tenant_id: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user: UserInfo;
  };
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      tenant_id: string;
    };
  };
}

export const authAPI = {
  login: (username: string, password: string) => {
    return apiClient.post<LoginResponse>('/auth/login', { username, password });
  },

  register: (data: { username: string; password: string; email: string }) => {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  },

  getUserInfo: () => {
    return apiClient.get<{ code: number; message: string; data: UserInfo }>('/user/info');
  },
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};
