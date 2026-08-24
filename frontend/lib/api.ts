const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:5000/api/v1';

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
          reject(new Error(res.message || 'Failed to upload document'));
        }
      } catch (err) {
        reject(new Error('Invalid response server payload'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during file upload. Check backend connection.'));
    });

    xhr.open('POST', `${API_BASE_URL}/documents/upload`);
    xhr.send(formData);
  });
}

export async function fetchDocuments(): Promise<DocumentData[]> {
  const res = await fetch(`${API_BASE_URL}/documents`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Failed to fetch documents');
  }
  return json.data;
}

export async function fetchDocumentById(id: string): Promise<DocumentData> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Failed to fetch document');
  }
  return json.data;
}

export async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${API_BASE_URL}/documents/stats`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Failed to fetch stats');
  }
  return json.data;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Failed to delete document');
  }
}
