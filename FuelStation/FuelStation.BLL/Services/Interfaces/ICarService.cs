using FuelStation.Common.Models.DTOs.Car;

namespace FuelStation.BLL.Services.Interfaces;

public interface ICarService
{
    Task<CarDTO> AddCarAsync(Guid userId, CreateCarDTO dto);
    Task<bool> DeleteCarAsync(Guid userId, Guid carId);
    Task<List<CarDTO>> GetUserCarsAsync(Guid userId);
    Task<CarDTO> UpdateCarAsync(Guid userId, Guid carId, UpdateCarDTO dto);
}

