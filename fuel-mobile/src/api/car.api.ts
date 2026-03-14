import type { CarDTO, CreateCarDTO, UpdateCarDTO } from '../types/api.types';
import axiosInstance from './axiosInstance';

export const carApi = {
  getAll: () => axiosInstance.get<CarDTO[]>('/api/car'),

  create: (body: CreateCarDTO) =>
    axiosInstance.post<CarDTO>('/api/car', body),

  update: (carId: string, body: UpdateCarDTO) =>
    axiosInstance.put<CarDTO>('/api/car', body, { params: { carId } }),

  delete: (carId: string) =>
    axiosInstance.delete('/api/car', { params: { carId } }),
};
