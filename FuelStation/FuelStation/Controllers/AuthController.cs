using FuelStation.BLL.Services.Interfaces.Auth;
using FuelStation.Common.Models.DTOs.Auth;
using Microsoft.AspNetCore.Mvc;

namespace FuelStation.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRefreshTokenService _refreshTokenService;

    public AuthController(
        IAuthService authService,
        IRefreshTokenService refreshTokenService)
    {
        _authService = authService;
        _refreshTokenService = refreshTokenService;
    }

    [HttpPost("sign-up")]
    [ProducesResponseType(typeof(AuthSuccessDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> SignUp(SignUpDTO dto)
    {
        var result = await _authService.SignUpAsync(dto);
        return Ok(result);
    }

    [HttpPost("sign-in")]
    [ProducesResponseType(typeof(AuthSuccessDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> SignIn(SignInDTO dto)
    {
        var result = await _authService.SignInAsync(dto);
        return Ok(result);
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(AuthSuccessDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> RefreshToken(RefreshTokenDTO dto)
    {
        return Ok(await _refreshTokenService.RefreshTokenAsync(dto));
    }
}