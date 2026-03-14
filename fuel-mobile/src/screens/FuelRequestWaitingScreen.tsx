// src/screens/FuelRequestWaitingScreen.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // <-- замість next/router
import axiosInstance from '../api/axiosInstance';
import RobotRouteMap from '../components/RobotRouteMap';
import type { FuelRequestDTO } from '../types/api.types';

export default function FuelRequestWaitingScreen() {
  const { requestId } = useParams<{ requestId: string }>();

  const [fuelRequest, setFuelRequest] = useState<FuelRequestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axiosInstance.get<FuelRequestDTO>(`/api/fuel-request?requestId=${requestId}`);
        setFuelRequest(data);
console.log(data.status);
        if (data.status === 2) {
          setInProgress(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId]);

  if (loading) return <p>Завантаження...</p>;
  if (!fuelRequest) return <p>Замовлення не знайдено</p>;

  if (!inProgress) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Очікування на заправку...</h2>
        <p>Ваш робот вже їде до вас 🚗💨</p>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>Робот в дорозі</h2>
      {fuelRequest.route?.geometry ? (
        <RobotRouteMap
          encodedPolyline={fuelRequest.route.geometry}
          speed={0.005}
          height="500px"
        />
      ) : (
        <p>Маршрут ще не сформовано...</p>
      )}
    </div>
  );
}