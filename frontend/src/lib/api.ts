/**
 * SIRAGU Trace API Client.
 * Connects frontend directly to NestJS backend endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // If unauthorized, clear token if stored
    if (localStorage.getItem('token') && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
    }
  }

  if (!response.ok) {
    let errData: any = null;
    try {
      errData = await response.json();
    } catch {
      errData = { message: response.statusText };
    }
    const message = Array.isArray(errData?.message)
      ? errData.message.join(', ')
      : errData?.message || `HTTP ${response.status}`;
    throw new ApiError(response.status, message, errData);
  }

  // If response is 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  // If endpoint returned HTML (e.g. Vercel SPA index.html fallback for missing backend /api routes)
  throw new ApiError(
    404,
    `Endpoint ${endpoint} returned non-JSON response (${contentType || 'none'}). Backend API may be unreachable.`,
  );
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};

// ── Auth Endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ access_token: string; user: any }>('/auth/login', credentials),
  me: () => api.get<any>('/auth/me'),
};

// ── Lots Endpoints ────────────────────────────────────────────────────────────
export const lotsApi = {
  list: (status?: string) => api.get<any[]>(`/lots${status ? `?status=${status}` : ''}`),
  get: (id: string) => api.get<any>(`/lots/${id}`),
  create: (data: any) => api.post<any>('/lots', data),
  release: (id: string, data?: any) => api.post<any>(`/lots/${id}/release`, data || {}),
  trace: (id: string, direction = 'both', depth = 1) =>
    api.get<any>(`/lots/${id}/trace?direction=${direction}&depth=${depth}`),
};

// ── Process Events Endpoints ──────────────────────────────────────────────────
export const processEventsApi = {
  list: () => api.get<any[]>('/process-events'),
  create: (data: any) => api.post<any>('/process-events', data),
};

// ── Quality Endpoints ─────────────────────────────────────────────────────────
export const qualityApi = {
  listInspections: (lotId?: string) =>
    api.get<any[]>(`/quality/inspections${lotId ? `?lotId=${lotId}` : ''}`),
  createInspection: (data: any) => api.post<any>('/quality/inspections', data),
};

// ── Packaging Endpoints ───────────────────────────────────────────────────────
export const packagingApi = {
  list: () => api.get<any[]>('/packaging'),
  create: (data: any) => api.post<any>('/packaging', data),
  getSerials: (packageId: string) => api.get<any[]>(`/packaging/${packageId}/serials`),
};

// ── Distribution & Shipments Endpoints ────────────────────────────────────────
export const distributionApi = {
  listShipments: () => api.get<any[]>('/distribution/shipments'),
  getShipment: (id: string) => api.get<any>(`/distribution/shipments/${id}`),
  createShipment: (data: any) => api.post<any>('/distribution/shipments', data),
  listComplaints: () => api.get<any[]>('/distribution/complaints'),
  createComplaint: (data: any) => api.post<any>('/distribution/complaints', data),
};

// ── Certificates Vault Endpoints ──────────────────────────────────────────────
export const certificatesApi = {
  list: () => api.get<any[]>('/certificates'),
  create: (data: any) => api.post<any>('/certificates', data),
  delete: (id: string) => api.delete<any>(`/certificates/${id}`),
};

// ── Suppliers & Farmers Endpoints ─────────────────────────────────────────────
export const suppliersApi = {
  list: () => api.get<any[]>('/suppliers'),
  create: (data: any) => api.post<any>('/suppliers', data),
};

// ── Buyers Endpoints ──────────────────────────────────────────────────────────
export const buyersApi = {
  list: () => api.get<any[]>('/buyers'),
  create: (data: any) => api.post<any>('/buyers', data),
};

// ── IoT Endpoints ─────────────────────────────────────────────────────────────
export const iotApi = {
  getSensors: () => api.get<any[]>('/iot/v1/sensors'),
  getSensorReadings: (sensorId: string, hours = 24) =>
    api.get<any[]>(`/iot/v1/sensors/${sensorId}/readings?hours=${hours}`),
  getBoxReadings: (boxId: string) => api.get<any>(`/iot/v1/boxes/${boxId}/readings`),
  getAlerts: () => api.get<any[]>('/iot/v1/alerts'),
  simulate: (data: { boxId: string; scenario: 'normal' | 'warning' | 'deviation'; durationHours?: number }) =>
    api.post<any>('/iot/v1/simulate', data),
  importCsv: (data: { boxId: string; csvContent: string; deviceId?: string }) =>
    api.post<any>('/iot/v1/import-csv', data),
};

// ── Public Unauthenticated Passport Endpoints ─────────────────────────────────
export const publicApi = {
  getLotPassport: (token: string) => api.get<any>(`/public/v1/lots/${token}`),
  getShipmentPassport: (token: string) => api.get<any>(`/public/v1/shipments/${token}`),
  getDossier: (token: string) => api.get<any>(`/public/v1/dossier/${token}`),
  getLotPdfUrl: (token: string) => `${API_BASE}/public/v1/lots/${token}/pdf`,
  getShipmentPdfUrl: (token: string) => `${API_BASE}/public/v1/shipments/${token}/pdf`,
};
