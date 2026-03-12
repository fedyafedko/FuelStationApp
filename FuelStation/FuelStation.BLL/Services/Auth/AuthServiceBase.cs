using FuelStation.BLL.Utility;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.Configs;
using FuelStation.Common.Models.DTOs.Auth;
using FuelStation.DAL.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FuelStation.BLL.Services.Auth;

public abstract class AuthServiceBase
{
    protected readonly JwtConfig _jwtConfig;
    protected readonly UserManager<User> _userManager;
    protected readonly ILogger<AuthServiceBase> _logger;

    protected AuthServiceBase(
        UserManager<User> userManager,
        JwtConfig jwtConfig,
        ILogger<AuthServiceBase> logger)
    {
        _userManager = userManager;
        _jwtConfig = jwtConfig;
        _logger = logger;
    }

    protected async Task<AuthSuccessDTO> GenerateAuthResultAsync(User user)
    {
        var refreshToken = await GenerateRefreshTokenAsync(user)
            ?? throw new IdentityException("Unable to generate refresh token");

        return new AuthSuccessDTO { AccessToken = GenerateJwtToken(user), RefreshToken = refreshToken };
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtConfig.Secret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            }),
            Expires = DateTime.UtcNow.Add(_jwtConfig.AccessTokenLifetime),
            SigningCredentials =
                new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _jwtConfig.Issuer,
            Audience = _jwtConfig.Audience
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtToken = tokenHandler.WriteToken(token);
        return jwtToken;
    }

    private async Task<string?> GenerateRefreshTokenAsync(User user)
    {
        user.RefreshToken = TokenGenerator.GenerateToken();
        user.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.Add(_jwtConfig.RefreshTokenLifetime);
        var userUpdated = await _userManager.UpdateAsync(user);
        if (!userUpdated.Succeeded)
        {
            _logger.LogError("Can not generate refresh token");
            return null;
        }

        return user.RefreshToken;
    }
}