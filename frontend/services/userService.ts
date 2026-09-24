import api from "./api";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/auth";

export const userService = {
  async getAll(): Promise<User[]> {
    return api.get<User[]>("/api/users");
  },

  async getById(id: number): Promise<User> {
    return api.get<User>(`/api/users/${id}`);
  },

  async create(data: CreateUserRequest): Promise<User> {
    return api.post<User>("/api/users", data);
  },

  async update(id: number, data: UpdateUserRequest): Promise<User> {
    return api.put<User>(`/api/users/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete<void>(`/api/users/${id}`);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return api.put<User>("/api/auth/profile", data);
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return api.put<void>("/api/auth/password", data);
  },
};

export default userService;
