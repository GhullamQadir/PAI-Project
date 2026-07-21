import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getToken = () => localStorage.getItem('auth_token');

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Mock auth: the backend isn't running in this environment, so we simulate
// success locally so the team can demo and iterate on the frontend.

export const loginUser = async (_email, _password) => {
  await new Promise((res) => setTimeout(res, 300)); // simulate network
  setToken('mock-jwt-token');
  return true;
};

export const registerUser = async (email, _password, fullName) => {
  await new Promise((res) => setTimeout(res, 300));
  setToken('mock-jwt-token');
  return { id: 1, email, full_name: fullName };
};

export const logoutUser = () => {
  setToken(null);
};

export const loginWithGoogle = async (_credential) => {
  await new Promise((res) => setTimeout(res, 300));
  setToken('mock-google-jwt-token');
  return true;
};

// ─── Request interceptor – attach token ───────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor – handle 401 ───────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logoutUser();
      window.dispatchEvent(new Event('auth_error'));
    }
    return Promise.reject(error);
  }
);

// ─── Mock data helpers ────────────────────────────────────────────────────────
const getStoredProjects = () => {
  try { return JSON.parse(localStorage.getItem('mock_projects') || '[]'); }
  catch { return []; }
};
const saveStoredProjects = (projects) =>
  localStorage.setItem('mock_projects', JSON.stringify(projects));

const getStoredVideos = () => {
  try { return JSON.parse(localStorage.getItem('mock_videos') || '[]'); }
  catch { return []; }
};
const saveStoredVideos = (videos) =>
  localStorage.setItem('mock_videos', JSON.stringify(videos));

// ─── Projects ─────────────────────────────────────────────────────────────────
export const getProjects = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return getStoredProjects();
};

export const getProject = async (projectId) => {
  await new Promise((r) => setTimeout(r, 200));
  const projects = getStoredProjects();
  const project = projects.find((p) => String(p.id) === String(projectId));
  if (!project) throw new Error('Project not found');
  return project;
};

export const createProject = async (title) => {
  await new Promise((r) => setTimeout(r, 200));
  const projects = getStoredProjects();
  const newProject = {
    id: Date.now(),
    title,
    created_at: new Date().toISOString(),
    video_count: 0,
  };
  saveStoredProjects([...projects, newProject]);
  return newProject;
};

export const deleteProject = async (projectId) => {
  await new Promise((r) => setTimeout(r, 200));
  const projects = getStoredProjects().filter((p) => String(p.id) !== String(projectId));
  saveStoredProjects(projects);
};

// ─── Videos ───────────────────────────────────────────────────────────────────
export const uploadVideo = async (file, projectId = null) => {
  // Mock: store file metadata locally, no real upload
  await new Promise((r) => setTimeout(r, 800));
  const videos = getStoredVideos();
  const newVideo = {
    id: Date.now(),
    filename: file.name,
    original_filename: file.name,
    stored_filename: URL.createObjectURL(file), // blob URL for local preview
    mime_type: file.type,
    size: file.size,
    duration: 60,
    project_id: projectId,
    created_at: new Date().toISOString(),
  };
  saveStoredVideos([...videos, newVideo]);

  // Update project video_count
  if (projectId) {
    const projects = getStoredProjects().map((p) =>
      String(p.id) === String(projectId)
        ? { ...p, video_count: (p.video_count || 0) + 1 }
        : p
    );
    saveStoredProjects(projects);
  }
  return newVideo;
};

export const getVideos = async (projectId = null) => {
  await new Promise((r) => setTimeout(r, 200));
  const all = getStoredVideos();
  return projectId
    ? all.filter((v) => String(v.project_id) === String(projectId))
    : all;
};

export const deleteVideo = async (videoId) => {
  await new Promise((r) => setTimeout(r, 200));
  const videos = getStoredVideos().filter((v) => String(v.id) !== String(videoId));
  saveStoredVideos(videos);
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const analyzeVideo = async (videoId) => {
  const response = await apiClient.post('/ai/analyze', { video_id: videoId });
  return response.data;
};

export const chatWithAI = async (message, videoId = null, sessionId = null) => {
  const response = await apiClient.post('/ai/chat', {
    message,
    video_id: videoId,
    session_id: sessionId,
  });
  return response.data;
};

// ─── Processing ───────────────────────────────────────────────────────────────
export const trimVideo = async (videoId, startTime, endTime) => {
  const response = await apiClient.post('/processing/trim', {
    video_id: videoId,
    start_time: startTime,
    end_time: endTime,
  });
  return response.data;
};

export const autoTrimVideo = async (videoId, thresholdDb = -30) => {
  const response = await apiClient.post('/processing/auto-trim', {
    video_id: videoId,
    threshold_db: thresholdDb,
  });
  return response.data;
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const saveAIConfig = async (geminiApiKey, groqApiKey) => {
  const response = await apiClient.post('/settings/ai-config', {
    gemini_api_key: geminiApiKey,
    groq_api_key: groqApiKey,
  });
  return response.data;
};

export const getAIStatus = async () => {
  const response = await apiClient.get('/settings/ai-status');
  return response.data;
};

// ─── Static helpers ───────────────────────────────────────────────────────────
export const getVideoStreamUrl = (filename) =>
  `http://127.0.0.1:8000/uploads/${filename}`;

// ─── Chat History ─────────────────────────────────────────────────────────────
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
    title,
    video_id: videoId,
  });
  return response.data;
};

export const sendChatMessage = async (sessionId, message, videoId = null) => {
  const response = await apiClient.post(`/chats/${sessionId}/message`, {
    message,
    video_id: videoId,
  });
  return response.data;
};

export default apiClient;
