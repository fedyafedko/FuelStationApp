using AutoMapper;
using FuelStation.BLL.Services.Interfaces.Auth;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.Configs;
using FuelStation.Common.Models.DTOs.Auth;
using FuelStation.DAL.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace FuelStation.BLL.Services.Auth;

public class AuthService : AuthServiceBase, IAuthService
{
    private readonly IMapper _mapper;

    public AuthService(
        IMapper mapper,
        ILogger<AuthService> logger,
        UserManager<User> userManager,
        JwtConfig jwtConfig)
        : base(userManager, jwtConfig, logger)
    {
        _mapper = mapper;
    }

    public async Task<AuthSuccessDTO> SignUpAsync(SignUpDTO dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is not null)
            throw new AlreadyExistsException("User with this email already exists");

        user = _mapper.Map<User>(dto);

        user.EmailConfirmed = true;

        var createdUser = await _userManager.CreateAsync(user, dto.Password);
        if (!createdUser.Succeeded)
        {
            _logger.LogError("Unable to create a user. Please try again later or use another email address");
            throw new IdentityException("Unable to create a user. Please try again later or use another email address");
        }

        var role = dto.Role;
        var roleResult = await _userManager.AddToRoleAsync(user, role);

        if (!roleResult.Succeeded)
        {
            _logger.LogError($"Failed to add user to role. Role: {role}");
            throw new IdentityException($"User manager operation failed: {roleResult.Errors}");
        }

        return await GenerateAuthResultAsync(user);
    }

    public async Task<AuthSuccessDTO> SignInAsync(SignInDTO dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new NotFoundException("User with this email does not exist");

        if (!user.EmailConfirmed)
            throw new BadRequestException("Confirm your email before signing in");

        var validPassword = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!validPassword)
            throw new BadRequestException("Email or password is incorrect");

        return await GenerateAuthResultAsync(user);
    }
}