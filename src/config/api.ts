// API 설정
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api',
  ENDPOINTS: {
    LOGIN: '/app_login_api.php',
    GET_CONSULTANTS: '/get_consultants_api.php',
    SEARCH_CANDIDATE: '/search_candidate_api.php',
  },
  TIMEOUT: 10000,
};

// API URL 생성 함수
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
