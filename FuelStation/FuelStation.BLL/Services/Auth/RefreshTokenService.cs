using FuelStation.BLL.Services.Interfaces.Auth;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.Configs;
using FuelStation.Common.Models.DTOs.Auth;
using FuelStation.DAL.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FuelStation.BLL.Services.Auth;

public class RefreshTokenService : AuthServiceBase, IRefreshTokenService
{
    private readonly TokenValidationParameters _tokenValidationParameters;

    public RefreshTokenService(
        UserManager<User> userManager,
        JwtConfig jwtConfig,
        ILogger<AuthServiceBase> logger,
        TokenValidationParameters tokenValidationParameters)
            : base(userManager, jwtConfig, logger)
    {
        _tokenValidationParameters = tokenValidationParameters;
    }

    public async Task<AuthSuccessDTO> RefreshTokenAsync(RefreshTokenDTO dto)
    {
        var token = GetPrincipalFromToken(dto.AccessToken)
            ?? throw new BadRequestException("Access token is invalid");

        var expiryDateUnix =
            long.Parse(token.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Exp).Value);
        var expiryDateTimeUtc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            .AddSeconds(expiryDateUnix);

        if (expiryDateTimeUtc > DateTime.UtcNow)
            throw new BadRequestException("Access token is not expired yet");

        var user = await _userManager.FindByIdAsync(token.Claims.Single(x => x.Type == "id").Value)
            ?? throw new BadRequestException("User with this id does not exist");

        if (DateTimeOffset.UtcNow > user.RefreshTokenExpiresAt)
            throw new ExpiredException("Refresh token is expired");

        if (user.RefreshToken != dto.RefreshToken)
            throw new BadRequestException("Refresh token is invalid");

        return await GenerateAuthResultAsync(user);
    }

    private ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = _tokenValidationParameters.Clone();
        validationParameters.ValidateLifetime = false;
        try
        {
            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            return HasValidSecurityAlgorithm(validatedToken) ? principal : null;
        }
        catch
        {
            return null;
        }
    }

    private bool HasValidSecurityAlgorithm(SecurityToken validatedToken)
    {
        return validatedToken is JwtSecurityToken jwtSecurityToken &&
               jwtSecurityToken.Header.Alg.Equals(
                   SecurityAlgorithms.HmacSha256,
                   StringComparison.InvariantCultureIgnoreCase);
    }
}
