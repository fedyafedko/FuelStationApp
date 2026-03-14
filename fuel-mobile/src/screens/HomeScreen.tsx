// src/screens/HomeScreen.tsx
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import UserLocationMap from '../components/UserLocationMap';
import type { CarDTO, CreateFuelRequestDTO } from '../types/api.types';
import axiosInstance from '../api/axiosInstance';

export default function HomeScreen() {
  const logout = useAuthStore((s) => s.logout);

  // стани
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [cars, setCars] = useState<CarDTO[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [requestedLiters, setRequestedLiters] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/sign-in';
  };

  const fetchCars = async () => {
    try {
      const { data } = await axiosInstance.get<CarDTO[]>('/api/car');
      setCars(data);
      if (data.length) setSelectedCarId(data[0].id);
    } catch (err) {
      console.error(err);
      alert('Помилка при завантаженні машин');
    }
  };

  const handleCreateFuelRequest = async () => {
    if (!selectedCarId || requestedLiters <= 0) {
      alert('Виберіть машину та введіть кількість літрів');
      return;
    }
  
    setLoading(true);
  
    // const getCurrentPositionAsync = (): Promise<GeolocationPosition> =>
    //   new Promise((resolve, reject) => {
    //     navigator.geolocation.getCurrentPosition(resolve, reject, {
    //       enableHighAccuracy: true,
    //       timeout: 20000,
    //     });
    //   });
  
    try {
      //const position = await getCurrentPositionAsync();
      const location = {
        latitude: 50.447925998975954,
        longitude: 30.452488349831874,
        // latitude: position.coords.latitude,
        // longitude: position.coords.longitude,
      };
  
      const body: CreateFuelRequestDTO = {
        carId: selectedCarId,
        requestedLiters,
        location,
      };
  
      const { data } = await axiosInstance.post('/api/fuel-request', body);

      console.log(data);
      setShowFuelModal(false);
  
      // Перенаправляємо на сторінку очікування з requestId
      window.location.href = `/fuel-request-waiting/${data.id}`;
    } catch (err) {
      console.error(err);
      alert('Не вдалося створити замовлення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>FuelStation Home</h2>

      <UserLocationMap height="400px" />

      <div style={{ marginTop: '16px' }}>
        <button onClick={() => { fetchCars(); setShowFuelModal(true); }}>
          Замовити паливо
        </button>
        <button style={{ marginLeft: '8px' }} onClick={() => window.location.href = '/cars'}>
          Машини
        </button>
        <button style={{ marginLeft: '8px' }} onClick={() => window.location.href = '/profile'}>
          Профіль
        </button>
        <button style={{ marginLeft: '8px' }} onClick={handleLogout}>
          Вийти
        </button>
      </div>

      {/* Модальне вікно для створення замовлення */}
      {showFuelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3>Нове замовлення палива</h3>

            <label>
              Машина:
              <select value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)}>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.mark} {car.model} ({car.carNumber})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginTop: '8px' }}>
              Кількість літрів:
              <input
                type="number"
                value={requestedLiters}
                onChange={(e) => setRequestedLiters(Number(e.target.value))}
              />
            </label>

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleCreateFuelRequest} disabled={loading}>
                {loading ? 'Створюємо...' : 'Створити'}
              </button>
              <button style={{ marginLeft: '8px' }} onClick={() => setShowFuelModal(false)}>
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}