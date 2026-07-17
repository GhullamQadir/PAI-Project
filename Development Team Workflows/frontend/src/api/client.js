import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Explicit authentication management
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getToken = () => {
  return localStorage.getItem('auth_token');
};

export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const formData = new URLSearchParams();
  formData.append('username', normalizedEmail); // OAuth2 expects 'username' field
  formData.append('password', password);
  
  const res = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  if (res.data && res.data.access_token) {
    setToken(res.data.access_token);
    return true;
  }
  return false;
};

export const registerUser = async (email, password, fullName = '') => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim() || normalizedEmail.split('@')[0];
  const res = await apiClient.post('/auth/register', {
    email: normalizedEmail,
    password: password,
    full_name: normalizedName
  });
  return res.data;
};

export const logoutUser = () => {
  setToken(null);
};

export const loginWithGoogle = async (googleToken) => {
  const res = await apiClient.post('/auth/google', {
    token: googleToken
  });
  if (res.data && res.data.access_token) {
    setToken(res.data.access_token);
    return true;
  }
  return false;
};

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 errors to force logout when token is invalid or database resets
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logoutUser();
      window.location.reload(); // Force re-render to show login page
    }
    return Promise.reject(error);
  }
);

export const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = getToken();
  const baseURL = apiClient.defaults.baseURL;
  const response = await fetch(`${baseURL}/videos/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      // Note: No Content-Type header. Fetch sets multipart/form-data with boundary automatically.
    },
    body: formData
  });

  if (!response.ok) {
    if (response.status === 401) {
      logoutUser();
      window.location.reload();
      throw new Error("Session expired. Please log in again.");
    }
    let detail = "Upload failed";
    try {
      const errData = await response.json();
      detail = errData.detail || detail;
    } catch (e) {
      detail = await response.text() || detail;
    }
    throw new Error(detail);
  }
  
  return await response.json();
};

export const getVideos = async () => {
  const response = await apiClient.get('/videos/');
  return response.data;
};

export const deleteVideo = async (videoId) => {
  await apiClient.delete(`/videos/${videoId}`);
};

export const analyzeVideo = async (videoId) => {
  const response = await apiClient.post('/ai/analyze', {
    video_id: videoId
  });
  return response.data;
};

export const chatWithAI = async (message, videoId = null, sessionId = null) => {
  const response = await apiClient.post('/ai/chat', {
    message: message,
    video_id: videoId,
    session_id: sessionId
  });
  return response.data;
};

export const trimVideo = async (videoId, startTime, endTime) => {
  const response = await apiClient.post('/processing/trim', {
    video_id: videoId,
    start_time: startTime,
    end_time: endTime
  });
  return response.data;
};

export const autoTrimVideo = async (videoId, thresholdDb = -30) => {
  const response = await apiClient.post('/processing/auto-trim', {
    video_id: videoId,
    threshold_db: thresholdDb
  });
  return response.data;
};

export const saveAIConfig = async (geminiApiKey, groqApiKey) => {
  const response = await apiClient.post('/settings/ai-config', {
    gemini_api_key: geminiApiKey,
    groq_api_key: groqApiKey
  });
  return response.data;
};

export const getAIStatus = async () => {
  const response = await apiClient.get('/settings/ai-status');
  return response.data;
};

// Helper for static files (video playback)
export const getVideoStreamUrl = (filename) => {
  return `http://localhost:8000/uploads/${filename}`;
};

// Chat History API
export const getChatSessions = async () => {
  const response = await apiClient.get('/chat_history/sessions');
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await apiClient.get(`/chat_history/sessions/${sessionId}`);
  return response.data;
};

export const createNewChat = async (title, videoId = null) => {
  const response = await apiClient.post('/chat_history/sessions', {
    title: title,
    video_id: videoId
  });
  return response.data;
};

export const sendChatMessage = async (sessionId, message, videoId = null) => {
  const response = await apiClient.post(`/chats/${sessionId}/message`, {
    message: message,
    video_id: videoId
  });
  return response.data;
};

export default apiClient;
