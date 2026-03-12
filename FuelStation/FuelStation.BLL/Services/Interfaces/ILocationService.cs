using FuelStation.Common.Models.DTOs.Location;

namespace FuelStation.BLL.Services.Interfaces;

public interface ILocationService
{
    Task<Guid> GetOrCreateLocationIdAsync(CreateLocationDTO dto);
}