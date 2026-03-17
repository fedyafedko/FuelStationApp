import type { CreateFuelRequestDTO } from '../types/api.types';
import axiosInstance from './axiosInstance';

export const fuelRequestApi = {
  create: (body: CreateFuelRequestDTO) =>
    axiosInstance.post('/api/fuel-request', body),

  confirm: (requestId: string, code: string) =>
    axiosInstance.put('/api/fuel-request/confirm', null, {
      params: { requestId, code },
    }),

  complete: (requestId: string) =>
    axiosInstance.put('/api/fuel-request/complete', null, {
      params: { requestId },
    }),

  sendCar: (requestId: string) =>
    axiosInstance.put('/api/fuel-request/send-car', null, {
      params: { requestId },
    }),
};
