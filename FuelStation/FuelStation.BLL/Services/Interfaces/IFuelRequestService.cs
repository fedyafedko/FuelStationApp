using FuelStation.Common.Models.DTOs.FuelRequest;

namespace FuelStation.BLL.Services.Interfaces;

public interface IFuelRequestService
{
    Task CancelRequestAsync(Guid userId, Guid requestId, CancelRequestDTO dto);
    Task CompleteRequestAsync(Guid userId, Guid requestId);
    Task ConfirmRequestAsync(Guid userId, Guid requestId, string code);
    Task<FuelRequestDTO> CreateAsync(Guid userId, CreateFuelRequestDTO dto);
    Task<List<FuelRequestDTO>> GetAllFuelRequestsAsync();
    Task<FuelRequestDTO> GetByIdAsync(Guid requestId);
    Task<List<FuelRequestDTO>> GetFuelRequestsAsync(Guid userId);
    Task PaidAsync(Guid userId, Guid requestId);
    Task SendCarToRequestAsync(Guid userId, Guid requestId);
}