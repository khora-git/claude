import { API_CONFIG, getApiUrl } from '../config/api';

// 로그인 API
export const loginApi = async (username: string, password: string) => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 컨설턴트 목록 조회 API
export const getConsultantsApi = async (apiKey: string) => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GET_CONSULTANTS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get consultants error:', error);
    throw error;
  }
};

// 후보자 검색 API
export const searchCandidateApi = async (apiKey: string, phoneNumber: string) => {
  try {
    // 전화번호에서 숫자만 추출
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SEARCH_CANDIDATE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        phone_number: cleanPhoneNumber,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search candidate error:', error);
    throw error;
  }
};
