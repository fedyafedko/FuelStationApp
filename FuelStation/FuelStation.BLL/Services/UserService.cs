using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.DTOs.User;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FuelStation.BLL.Services;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly IRepository<User> _userRepository;
    private readonly IMapper _mapper;

    public UserService(
        UserManager<User> userManager,
        IRepository<User> userRepository,
        IMapper mapper)
    {
        _userManager = userManager;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<UserDTO> GetUserAsync(Guid userId)
    {
        var entity = await _userRepository.Query()
            .Include(x => x.Cars)
            .ThenInclude(x => x.FuelRequests)
            .FirstOrDefaultAsync(x => x.Id == userId)
            ?? throw new NotFoundException("User not found");

        var user = _mapper.Map<UserDTO>(entity);

        return user;
    }

    public async Task<UserDTO> UpdateUserAsync(Guid userId, UpdateUserDTO dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        _mapper.Map(dto, user);

        var result = await _userRepository.UpdateAsync(user);

        if (!result)
            throw new ExternalException($"Can not update user. userId: {userId}");

        return _mapper.Map<UserDTO>(user);
    }
}