const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Chyba ${res.status}`);
  }

  return data as T;
}

// Auth
export const api = {
  auth: {
    register: (email: string, password: string) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    login: (email: string, password: string) =>
      request<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    me: () => request<User>("/auth/me"),

    forgotPassword: (email: string) =>
      request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },

  makers: {
    getProfile: () => request<MakerProfile>("/makers/profile"),
    createProfile: (data: { brandName: string; bio?: string }) =>
      request<MakerProfile>("/makers/profile", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProfile: (data: Partial<{ brandName: string; bio: string; videoUrl: string }>) =>
      request<MakerProfile>("/makers/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  products: {
    list: () => request<Product[]>("/products"),
    get: (id: string) => request<Product>(`/products/${id}`),
    create: (data: CreateProductData) =>
      request<Product>("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CreateProductData>) =>
      request<Product>(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/products/${id}`, { method: "DELETE" }),
  },

  ai: {
    analyze: (productId: string, platform: "etsy" | "amazon" = "etsy") =>
      request<AiResult>(`/products/${productId}/analyze?platform=${platform}`, {
        method: "POST",
      }),
    getOptimizations: (productId: string) =>
      request<AiOptimization[]>(`/products/${productId}/optimizations`),
  },
};

// Typy
export interface User {
  id: string;
  email: string;
  role: "admin" | "maker";
  plan: "free" | "mini" | "midi" | "max";
  isFoundingMember: boolean;
  emailVerified: boolean;
  aiUsageThisMonth?: number;
}

export interface MakerProfile {
  id: string;
  brandName: string;
  bio?: string;
  profileImageUrl?: string;
  videoUrl?: string;
  marketplaceLinks?: Record<string, string>;
}

export interface Product {
  id: string;
  titleOriginal: string;
  descriptionOriginal: string;
  priceOriginal?: number;
  category?: string;
  status: "draft" | "analyzed" | "completed";
  images?: { id: string; imageUrl: string; orderIndex: number }[];
  optimizations?: AiOptimization[];
  createdAt: string;
}

export interface CreateProductData {
  titleOriginal: string;
  descriptionOriginal: string;
  priceOriginal?: number;
  category?: string;
}

export interface AiOptimization {
  id: string;
  titleOptimized: string;
  descriptionOptimized: string;
  keywords: string[];
  pricingRecommendation: string;
  competitivenessScore: number;
  aiModelUsed: string;
  platform: string;
  createdAt: string;
}

export interface AiResult {
  optimization: AiOptimization;
  newUsage: number;
}
