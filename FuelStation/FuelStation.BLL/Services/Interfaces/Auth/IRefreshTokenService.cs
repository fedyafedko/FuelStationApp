using FuelStation.Common.Models.DTOs.Auth;

namespace FuelStation.BLL.Services.Interfaces.Auth;

public interface IRefreshTokenService
{
    Task<AuthSuccessDTO> RefreshTokenAsync(RefreshTokenDTO dto);
}

