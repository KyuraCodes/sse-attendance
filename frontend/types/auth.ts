export type UserRole = "CEO" | "ADMIN" | "MANAGER" | string;
export type UserStatus = "ACTIVE" | "INACTIVE" | string;

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  password?: string;
  role: string;
  status?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  name: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  code?: string | null;
  data?: T | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
