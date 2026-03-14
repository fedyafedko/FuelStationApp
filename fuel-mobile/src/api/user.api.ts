import type { UserDTO, UpdateUserDTO } from '../types/api.types';
import axiosInstance from './axiosInstance';

export const userApi = {
  getProfile: () => axiosInstance.get<UserDTO>('/api/user'),

  update: (body: UpdateUserDTO) =>
    axiosInstance.put<UserDTO>('/api/user', body),
};
