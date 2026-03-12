using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.DTOs.Car;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FuelStation.BLL.Services;

public class CarService : ICarService
{
    private readonly IRepository<Car> _carRepository;
    private readonly UserManager<User> _userManager;
    private readonly IMapper _mapper;

    public CarService(
        IRepository<Car> carRepository,
        IMapper mapper,
        UserManager<User> userManager)
    {
        _carRepository = carRepository;
        _mapper = mapper;
        _userManager = userManager;
    }

    public async Task<CarDTO> AddCarAsync(Guid userId, CreateCarDTO dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        var entity = _mapper.Map<Car>(dto);
        entity.UserId = user.Id;

        var result = await _carRepository.InsertAsync(entity);

        if (!result)
            throw new ExternalException($"Can not create car for user. UserId: {userId}");

        return _mapper.Map<CarDTO>(entity);
    }

    public async Task<CarDTO> UpdateCarAsync(Guid userId, Guid carId, UpdateCarDTO dto)
    {
        var car = await _carRepository
            .Query()
            .FirstOrDefaultAsync(x => x.Id == carId)
            ?? throw new NotFoundException("Car not found");

        if (car.UserId != userId)
            throw new ForbiddenException("Access denied");

        _mapper.Map(dto, car);

        var result = await _carRepository.UpdateAsync(car);

        if (!result)
            throw new ExternalException($"Can not update car. CarId: {carId}");

        return _mapper.Map<CarDTO>(car);
    }

    public async Task<List<CarDTO>> GetUserCarsAsync(Guid userId)
    {
        var cars = await _carRepository
            .Query()
            .Where(x => x.UserId == userId)
            .ToListAsync();

        return _mapper.Map<List<CarDTO>>(cars);
    }

    public async Task<bool> DeleteCarAsync(Guid userId, Guid carId)
    {
        var car = await _carRepository
            .Query()
            .FirstOrDefaultAsync(x => x.Id == carId)
            ?? throw new NotFoundException("Car not found");

        if (car.UserId != userId)
            throw new UnauthorizedAccessException("Access denied");

        var result = await _carRepository.DeleteAsync(car);

        if (!result)
            throw new ExternalException($"Can not delete car. CarId: {carId}");

        return result;
    }
}