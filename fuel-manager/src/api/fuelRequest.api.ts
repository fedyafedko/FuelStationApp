import type { CreateFuelRequestDTO } from '../types/api.types';
import axiosInstance from './axiosInstance';

export const fuelRequestApi = {
  create: (body: CreateFuelRequestDTO) =>
    axiosInstance.post('/api/fuel-request', body),

  confirm: (requestId: string, code: string) =>
    axiosInstance.put(`api/fuel-request/confirm?requestId=${requestId}&code=${code}`),

  complete: (requestId: string) =>
    axiosInstance.put('/api/fuel-request/complete', null, {
      params: { requestId },
  }),

  sendCar: (requestId: string) =>
    axiosInstance.put('/api/fuel-request/send-car', null, {
      params: { requestId },
  }),

  paid: (requestId: string) =>
    axiosInstance.put('/api/fuel-request/paid', null, {
      params: { requestId },
  }),

  cancel: (requestId: string, reason: string) =>
    axiosInstance.put('/api/fuel-request/cancel', { reason: reason }, {
      params: { requestId },
  }),

  history: () =>
    axiosInstance.get('/api/fuel-request/history'),

  getAll: () =>
    axiosInstance.get('/api/fuel-request/all'),

  getById: (requestId: string) =>
    axiosInstance.get(`/api/fuel-request?requestId=${requestId}`),
};
