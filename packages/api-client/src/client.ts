import { LoginInput, RegisterInput, TransactionInput } from "@money/shared";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Network request failed",
        errors: [error],
      };
    }
  }

  // Auth Endpoints
  async register(input: RegisterInput): Promise<ApiResponse> {
    return this.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request("/api/v1/auth/logout", {
      method: "POST",
    });
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.request("/api/v1/auth/me", {
      method: "GET",
    });
  }

  async updateMe(input: any): Promise<ApiResponse<any>> {
    return this.request("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  // Transaction Endpoints
  async getTransactions(query?: string): Promise<ApiResponse<any>> {
    const queryString = query ? `?${query}` : "";
    return this.request(`/api/v1/transactions${queryString}`, {
      method: "GET",
    });
  }

  async createTransaction(input: TransactionInput, idempotencyKey?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.request("/api/v1/transactions", {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });
  }

  async getTransaction(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/transactions/${id}`, {
      method: "GET",
    });
  }

  async updateTransaction(id: string, input: Partial<TransactionInput>): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/transactions/${id}`, {
      method: "DELETE",
    });
  }

  // Category Endpoints
  async getCategories(type?: "income" | "expense"): Promise<ApiResponse<any[]>> {
    const queryString = type ? `?type=${type}` : "";
    return this.request(`/api/v1/categories${queryString}`, {
      method: "GET",
    });
  }

  async createCategory(input: { name: string; icon: string; type: "income" | "expense" }): Promise<ApiResponse<any>> {
    return this.request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // Account Endpoints
  async getAccounts(): Promise<ApiResponse<any[]>> {
    return this.request("/api/v1/accounts", {
      method: "GET",
    });
  }

  async createAccount(input: { name: string; type: string; currency: string; initialBalance: number }): Promise<ApiResponse<any>> {
    return this.request("/api/v1/accounts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // Analytics Endpoints
  async getSpendingAnalytics(query?: string): Promise<ApiResponse<any>> {
    const queryString = query ? `?${query}` : "";
    return this.request(`/api/v1/analytics/spending${queryString}`, {
      method: "GET",
    });
  }
}
