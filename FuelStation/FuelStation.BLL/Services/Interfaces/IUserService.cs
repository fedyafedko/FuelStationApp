using FuelStation.Common.Models.DTOs.User;

namespace FuelStation.BLL.Services.Interfaces;

public interface IUserService
{
    Task<UserDTO> GetUserAsync(Guid userId);
    Task<UserDTO> UpdateUserAsync(Guid userId, UpdateUserDTO dto);
}