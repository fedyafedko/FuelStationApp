export interface AuthSuccessDTO {
  accessToken: string;
  refreshToken: string;
}

export interface SignUpDTO {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  accessToken: string;
  refreshToken: string;
}

export enum FuelType {
  Petrol = 0,
  Diesel = 1,
  Gas = 2,
}

export interface CreateCarDTO {
  mark: string;
  model: string;
  engineCapacity: number;
  carNumber: string;
  tankCapacity: number;
  fuelType: FuelType;
}

export interface UpdateCarDTO extends CreateCarDTO {}

export interface CarDTO extends CreateCarDTO {
  id: string;
}

export interface CreateLocationDTO {
  latitude: number;
  longitude: number;
}

export interface CreateFuelRequestDTO {
  carId: string;
  location: CreateLocationDTO;
  requestedLiters: number;
}

export interface UpdateUserDTO {
  name: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role?: string;
}


// src/types/api.types.ts

// Статус замовлення
export type RequestStatus = 0 | 1 | 2 | 3;

// Локація
export interface LocationDTO {
  latitude: number;
  longitude: number;
}

export interface RouteDTO {
  id: string;
  fuelRequestId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number;      // метри
  duration: number;      // секунди
  geometry: string;      // закодований polyline
  createdAt: string;
}

export interface FuelRequestDTO {
  id: string;                // Guid
  carId: string;             // Guid машини
  status: RequestStatus;     // Статус замовлення
  requestedLiters: number;   // Кількість літрів
  totalPrice: number;        // Загальна ціна
  createAt: string;          // Дата створення (ISO string)
  route?: RouteDTO;          // маршрут робота (опціонально)
}