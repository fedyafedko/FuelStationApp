import type { AuthSuccessDTO, SignInDTO, SignUpDTO, RefreshTokenDTO } from '../types/api.types';
import axiosInstance from './axiosInstance';

export const authApi = {
  signUp: (body: SignUpDTO) =>
    axiosInstance.post<AuthSuccessDTO>('/api/auth/sign-up', body),

  signIn: (body: SignInDTO) =>
    axiosInstance.post<AuthSuccessDTO>('/api/auth/sign-in', body),

  refreshToken: (body: RefreshTokenDTO) =>
    axiosInstance.post<AuthSuccessDTO>('/api/auth/refresh-token', body),
};
