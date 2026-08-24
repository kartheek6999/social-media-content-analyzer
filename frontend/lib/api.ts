const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/v1`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export interface DocumentData {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  analysis?: {
    contentType: string;
    summary: string;
    engagementScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    hookSuggestion: string;
    ctaSuggestion: string;
    hashtags: string[];
    readability: {
      score: number;
      feedback: string;
    };
  };
}

export interface StatsData {
  total: number;
  completed: number;
  failed: number;
  processing: number;
}

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Uploads a document (PDF or image) with upload progress callback and error normalization.
 */
export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; data: DocumentData; message?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          resolve(res);
        } else {
          const userMsg = res.message || 'Unable to process document. Please verify file format and try again.';
          reject(new ApiError(userMsg, xhr.status));
        }
      } catch (err) {
        reject(new ApiError('Invalid response from server. Please try again.', xhr.status || 500));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('Network connection error. Unable to reach backend server.', 0));
    });

    xhr.addEventListener('timeout', () => {
      reject(new ApiError('File upload timed out. Please try uploading a smaller file.', 408));
    });

    xhr.timeout = 60000; // 60 seconds timeout
    xhr.open('POST', `${getApiBaseUrl()}/documents/upload`);
    xhr.send(formData);
  });
}

/**
 * Safe fetch helper with normalized error handling.
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      ...options,
    });
  } catch (err) {
    throw new ApiError('Unable to connect to server. Please check backend network connection.', 0);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (err) {
    throw new ApiError('Unexpected server response format.', res.status);
  }

  if (!res.ok || !json.success) {
    const message = json.message || `Server request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return json.data;
}

export async function fetchDocuments(): Promise<DocumentData[]> {
  return fetchJson<DocumentData[]>(`${getApiBaseUrl()}/documents`);
}

export async function fetchDocumentById(id: string): Promise<DocumentData> {
  return fetchJson<DocumentData>(`${getApiBaseUrl()}/documents/${encodeURIComponent(id)}`);
}

export async function fetchStats(): Promise<StatsData> {
  return fetchJson<StatsData>(`${getApiBaseUrl()}/documents/stats`);
}

export async function deleteDocument(id: string): Promise<void> {
  await fetchJson<void>(`${getApiBaseUrl()}/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
