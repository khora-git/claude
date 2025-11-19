import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      mb_id: string;
      mb_name: string;
      mb_nick: string;
      mb_email: string;
      mb_hp: string;
      mb_level: string;
    };
  };
  message?: string;
  error?: string;
}

export interface CandidateInfo {
  id: string;
  name: string;
  phone_numbers: string;
  email: string;
  stage: string;
  applied_position: string;
  applied_company: string;
  consultant_1_id: string;
  consultant_2_id: string;
}

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (
  mb_id: string,
  mb_password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
      mb_id,
      mb_password,
    });

    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('user_info', JSON.stringify(response.data.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    return {
      success: false,
      error: 'LOGIN_FAILED',
      message: '로그인 실패. 네트워크 연결을 확인하세요.',
    };
  }
};

export const searchCandidate = async (
  phone: string
): Promise<CandidateInfo | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      console.error('No token found');
      return null;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `${API_CONFIG.ENDPOINTS.SEARCH_CANDIDATE}?phone=${cleanPhone}&token=${token}`;

    const response = await api.get(url);

    if (response.data.success && response.data.data.found && response.data.data.candidates.length > 0) {
      return response.data.data.candidates[0];
    }

    return null;
  } catch (error) {
    console.error('Search Candidate Error:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_info');
  } catch (error) {
    console.error('Logout Error:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Get Current User Error:', error);
    return null;
  }
};

export default api;
