using FuelStation.Common.Models.DTOs.FuelRequest;

namespace FuelStation.BLL.Services.Interfaces;

public interface IFuelRequestService
{
    Task CompleteRequestAsync(Guid userId, Guid requestId);
    Task ConfirmRequestAsync(Guid userId, Guid requestId, string code);
    Task<FuelRequestDTO> CreateAsync(Guid userId, CreateFuelRequestDTO dto);
}