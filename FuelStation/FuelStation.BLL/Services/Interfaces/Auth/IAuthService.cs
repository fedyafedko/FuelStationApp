using FuelStation.Common.Models.DTOs.Auth;

namespace FuelStation.BLL.Services.Interfaces.Auth;

public interface IAuthService
{
    Task<AuthSuccessDTO> SignUpAsync(SignUpDTO dto);

    Task<AuthSuccessDTO> SignInAsync(SignInDTO dto);
}