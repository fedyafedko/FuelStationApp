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

export const FuelType = {
  Petrol: 0,
  Diesel: 1,
  Gas: 2,
} as const;

export type FuelType = typeof FuelType[keyof typeof FuelType];

export interface CreateCarDTO {
  mark: string;
  model: string;
  engineCapacity: number;
  carNumber: string;
  tankCapacity: number;
  fuelType: FuelType;
}

export type UpdateCarDTO = CreateCarDTO

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

export type RequestStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
  distance: number;
  duration: number;
  geometry: string;
  createdAt: string;
}

export interface FuelRequestDTO {
  id: string;
  carId: string;
  status: RequestStatus;
  requestedLiters: number;
  totalPrice: number;
  createAt: string;
  cancelReason: string;      
  route?: RouteDTO;
  car: CarDTO;
}