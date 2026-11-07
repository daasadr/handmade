import { getStored, removeStored } from "./safe-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getToken(): string | null {
  return getStored("access_token");
}

function handleUnauthorized() {
  removeStored("access_token");
  window.location.href = "/login";
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

  // 401 = vyprší přihlášení → odhlásit a na /login. ALE jen u přihlášených
  // requestů. U /auth/* (login, register, …) znamená 401 „špatné údaje" a
  // patří k zobrazení hlášky na stránce — redirect by ji schoval a vypadalo
  // by to, že se formulář jen „sám odeslal zpět". (Odtud bounce bez hlášky.)
  if (res.status === 401 && !path.startsWith("/auth/")) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Chyba ${res.status}`);
  }

  return data as T;
}

async function requestFile<T>(path: string, body: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 413 od nginx nemá JSON tělo — bez tohohle by uživatel viděl jen „Chyba 413".
    if (res.status === 413 && !data?.message) {
      throw new Error(
        "Fotka je pro server příliš velká. Zkuste ji zmenšit — např. na squoosh.app — a nahrát znovu.",
      );
    }
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

    verifyEmail: (token: string) =>
      request(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "POST",
      }),

    resetPassword: (token: string, password: string) =>
      request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },

  makers: {
    getProfile: () => request<MakerProfile>("/makers/profile"),
    createProfile: (data: MakerProfileInput) =>
      request<MakerProfile>("/makers/profile", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProfile: (data: MakerProfileInput) =>
      request<MakerProfile>("/makers/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    uploadProfileImage: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return requestFile<MakerProfile>("/makers/profile/image", form);
    },
    // Nahraje obrázek příběhu a vrátí jen URL (profil nemění) — URL se uloží
    // do storyImages a odešle s profilem.
    uploadStoryImage: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return requestFile<{ url: string }>("/makers/profile/story-image", form);
    },
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
    uploadImages: (id: string, files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      return requestFile<Product>(`/products/${id}/images`, form);
    },
    removeBg: (productId: string, imageId: string, bgColor?: string) =>
      request<Product>(`/products/${productId}/images/${imageId}/remove-bg`, {
        method: "POST",
        body: JSON.stringify({ bgColor }),
      }),
  },

  ai: {
    analyze: (productId: string, platform: Platform = "etsy", lang: "cs" | "en" = "cs") =>
      request<AiOptimization>(`/products/${productId}/analyze?platform=${platform}&lang=${lang}`, {
        method: "POST",
      }),
    getOptimizations: (productId: string) =>
      request<AiOptimization[]>(`/products/${productId}/optimizations`),
    // Doladění hotové optimalizace: AI zachová text, upraví jen zadané.
    refine: (
      productId: string,
      platform: Platform,
      instruction: string,
      lang: "cs" | "en" = "cs",
    ) =>
      request<AiOptimization>(
        `/products/${productId}/refine?platform=${platform}&lang=${lang}`,
        { method: "POST", body: JSON.stringify({ instruction }) },
      ),
  },

  // Veřejná výloha — nepřihlášené čtení.
  public: {
    listMakers: () => request<PublicMakerCard[]>("/public/makers"),
    getMaker: (id: string) => request<PublicMaker>(`/public/makers/${id}`),
  },

  // Blog — veřejné čtení.
  blog: {
    list: () => request<BlogPostCard[]>("/public/blog"),
    getBySlug: (slug: string) => request<BlogPost>(`/public/blog/${slug}`),
  },

  // Blog — správa (jen admin).
  adminBlog: {
    list: () => request<BlogPost[]>("/admin/blog"),
    getOne: (id: string) => request<BlogPost>(`/admin/blog/${id}`),
    create: (data: BlogPostInput) =>
      request<BlogPost>("/admin/blog", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: BlogPostInput) =>
      request<BlogPost>(`/admin/blog/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ message: string }>(`/admin/blog/${id}`, { method: "DELETE" }),
  },

  admin: {
    getUsers: () => request<AdminUser[]>("/admin/users"),
    updateUser: (id: string, data: UpdateAdminUserData) =>
      request<AdminUser>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getStats: () => request<AdminStats>("/admin/stats"),
  },

  billing: {
    createCheckout: (plan: "mini" | "midi" | "max") =>
      request<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    portal: () => request<{ url: string }>("/billing/portal"),
  },

  // Přímé napojení na Etsy (OAuth + odeslání konceptu listingu).
  etsy: {
    status: () => request<EtsyConnectionStatus>("/etsy/connection"),
    startUrl: () => request<{ url: string }>("/etsy/oauth/start"),
    disconnect: () =>
      request<EtsyConnectionStatus>("/etsy/connection", { method: "DELETE" }),
    // Založí koncept listingu v obchodě tvůrce; vrátí odkaz do editace konceptu.
    createDraft: (productId: string) =>
      request<{ listingId: string; url: string }>(
        `/products/${productId}/etsy-draft`,
        { method: "POST" },
      ),
  },
};

export interface EtsyConnectionStatus {
  connected: boolean;
  shopId?: string;
}

// Typy
export interface User {
  id: string;
  email: string;
  role: "admin" | "maker";
  plan: "free" | "mini" | "midi" | "max";
  isFoundingMember: boolean;
  /** VIP = neomezené optimalizace zdarma. Nezávislé na `plan`. */
  isVip?: boolean;
  /** Expirace VIP; `null`/chybí = neomezeně. */
  vipUntil?: string | null;
  emailVerified: boolean;
  aiUsageThisMonth?: number;
}

/** VIP platí, jen pokud příznak sedí a případná expirace ještě neuplynula. */
export function isVipActive(user?: Pick<User, "isVip" | "vipUntil"> | null): boolean {
  if (!user?.isVip) return false;
  if (!user.vipUntil) return true;
  return new Date(user.vipUntil).getTime() > Date.now();
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "maker";
  plan: "free" | "mini" | "midi" | "max";
  isFoundingMember: boolean;
  isVip: boolean;
  vipUntil?: string | null;
  emailVerified: boolean;
  aiUsageThisMonth: number;
  createdAt: string;
}

export interface UpdateAdminUserData {
  role?: "admin" | "maker";
  plan?: "free" | "mini" | "midi" | "max";
  isFoundingMember?: boolean;
  isVip?: boolean;
  vipUntil?: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  vipCount: number;
  planCounts: { plan: string; count: string }[];
}

export interface MakerProfile {
  id: string;
  brandName: string;
  bio?: string;
  motto?: string;
  storyAnswers?: Record<string, string>;
  storyImages?: Record<string, string>;
  storyMode?: "template" | "custom";
  storyHtml?: string;
  isPublic?: boolean;
  profileImageUrl?: string;
  videoUrl?: string;
  marketplaceLinks?: Record<string, string>;
}

/** Pole, která jdou poslat při vytvoření/úpravě profilu. */
export type MakerProfileInput = Partial<{
  brandName: string;
  bio: string;
  motto: string;
  storyAnswers: Record<string, string>;
  storyImages: Record<string, string>;
  storyMode: "template" | "custom";
  storyHtml: string;
  isPublic: boolean;
  videoUrl: string;
}>;

/** Veřejná výloha — karta tvůrce v adresáři. */
export interface PublicMakerCard {
  id: string;
  brandName: string;
  motto: string | null;
  profileImageUrl: string | null;
}

/** Veřejná výloha — produkt tvůrce. */
export interface PublicProductCard {
  id: string;
  title: string;
  category: string | null;
  price: number | null;
  imageUrl: string | null;
  etsyListingId: string | null;
}

/** Veřejná výloha — detail tvůrce (jen bezpečná pole z backendu). */
export interface PublicMaker {
  id: string;
  brandName: string;
  motto: string | null;
  bio: string | null;
  storyMode: "template" | "custom" | null;
  storyAnswers: Record<string, string>;
  storyImages: Record<string, string>;
  storyHtml: string | null;
  profileImageUrl: string | null;
  videoUrl: string | null;
  marketplaceLinks: Record<string, string>;
  products: PublicProductCard[];
}

/** Blog — karta ve výpisu (bez celého HTML). */
export interface BlogPostCard {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string;
}

/** Blog — plný článek (admin i veřejný detail). */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  coverImageUrl: string | null;
  authorName: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BlogPostInput = Partial<{
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  authorName: string;
  slug: string;
  published: boolean;
}>;

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

export type Platform = "etsy" | "amazon" | "fler";

export const PLATFORM_LABELS: Record<Platform, string> = {
  etsy: "Etsy",
  amazon: "Amazon Handmade",
  fler: "Fler",
};

/** Surová data konkurence — PŘECHODNÁ, jen v odpovědi na analýzu. Neukládá se. */
export interface CompetitionSnapshot {
  competitorCount: number;
  priceMin: number;
  priceMedian: number;
  priceMax: number;
  priceCurrency: string;
  topTags: string[];
}

export interface AiOptimization {
  id: string;
  titleOptimized: string;
  titleCzech?: string;
  descriptionOptimized: string;
  descriptionCzech?: string;
  keywords: string[];
  pricingRecommendation: string;
  pricingRecommendationCzech?: string;
  /** Pole na míru platformě: materials (Etsy/Fler), bulletPoints + searchTerms (Amazon). */
  platformFields?: {
    materials?: string[];
    bulletPoints?: string[];
    searchTerms?: string;
  };
  competitivenessScore: number;
  /** 'market' = z reálné konkurence (Etsy), 'ai' = odhad AI. */
  scoreSource?: "ai" | "market";
  /** Uložený textový závěr z dat konkurence (surová data se neukládají). */
  marketConclusion?: string | null;
  /** Surová data konkurence — jen v čerstvé odpovědi na analýzu, po reloadu mizí. */
  competition?: CompetitionSnapshot | null;
  aiModelUsed: string;
  platform: string;
  createdAt: string;
}
