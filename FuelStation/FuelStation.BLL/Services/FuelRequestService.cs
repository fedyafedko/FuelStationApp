using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Enums;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.DTOs.FuelRequest;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FuelStation.BLL.Services;

public class FuelRequestService : IFuelRequestService
{
    private readonly IRepository<FuelRequest> _fuelRequestRepository;
    private readonly IRepository<Car> _carRepository;
    private readonly IMapper _mapper;
    private readonly ILocationService _locationService;

    public FuelRequestService(
        IRepository<FuelRequest> fuelRequestRepository,
        IRepository<Car> carRepository,
        IMapper mapper,
        ILocationService locationService)
    {
        _fuelRequestRepository = fuelRequestRepository;
        _carRepository = carRepository;
        _mapper = mapper;
        _locationService = locationService;
    }

    public async Task<FuelRequestDTO> GetByIdAsync(Guid requestId)
    {
        var request = await _fuelRequestRepository
            .Query()
            .Include(x => x.Route)
            .FirstOrDefaultAsync(x => x.Id == requestId);

        return _mapper.Map<FuelRequestDTO>(request);
    }

    public async Task<FuelRequestDTO> CreateAsync(Guid userId, CreateFuelRequestDTO dto)
    {
        var car = await _carRepository
            .Query()
            .FirstOrDefaultAsync(x => x.Id == dto.CarId)
            ?? throw new NotFoundException("Car not found");

        if (car.UserId != userId)
            throw new ForbiddenException("Access denied");

        var entity = _mapper.Map<FuelRequest>(dto);
        entity.LocationId = await _locationService.GetOrCreateLocationIdAsync(dto.Location);
        entity.CreateAt = DateTime.UtcNow;
        entity.Status = RequestStatus.Pending;
        entity.PricePerLiter = 50;
        entity.TotalPrice = (decimal)dto.RequestedLiters * entity.PricePerLiter;

        var result = await _fuelRequestRepository.InsertAsync(entity);

        if (!result)
            throw new ExternalException("Failed to create fuel request");

        return _mapper.Map<FuelRequestDTO>(entity);
    }

    public async Task ConfirmRequestAsync(Guid userId, Guid requestId, string code)
    {
        var request = await _fuelRequestRepository
            .Query()
            .Include(x => x.Car)
            .Include(x => x.Robot)
            .FirstOrDefaultAsync(x => x.Id == requestId)
            ?? throw new NotFoundException("Request not found");

        if (request.Car.UserId != userId)
            new ForbiddenException("Invalid user for this request");

        if (request.Robot.UniqueNumber != code)
            new ExternalException("Invalid unique number");

        request.IsConfirmed = true;
        request.Status = RequestStatus.WaitingForPayment;
        await _fuelRequestRepository.UpdateAsync(request);
    }

    public async Task PaidAsync(Guid userId, Guid requestId)
    {
        var request = await _fuelRequestRepository
            .Query()
            .Include(x => x.Car)
            .FirstOrDefaultAsync(x => x.Id == requestId)
            ?? throw new NotFoundException("Request not found");

        if (request.Car.UserId != userId)
            new ForbiddenException("Invalid user for this request");

        request.Status = RequestStatus.StartFueling;

        await _fuelRequestRepository.UpdateAsync(request);
    }

    public async Task CompleteRequestAsync(Guid userId, Guid requestId)
    {
        var request = await _fuelRequestRepository
            .Query()
            .Include(x => x.Car)
            .Include(x => x.Robot)
            .FirstOrDefaultAsync(x => x.Id == requestId)
            ?? throw new NotFoundException("Request not found");

        if (request.Car.UserId != userId)
            throw new ForbiddenException("Invalid user for this request");

        if (request.Status != RequestStatus.StartFueling)
            throw new InvalidOperationException("Fueling is not in progress");

        if (request.CompletedAt != null)
            throw new InvalidOperationException("Fuel request already completed");

        request.CompletedAt = DateTime.UtcNow;

        request.Status = RequestStatus.Completed;

        if (request.Robot != null)
        {
            request.Robot.Status = RobotStatus.Idle;
        }

        var updated = await _fuelRequestRepository.UpdateAsync(request);

        if (!updated)
            throw new ExternalException("Failed to complete fuel request");
    }

    public async Task SendCarToRequestAsync(Guid userId, Guid requestId)
    {
        var request = await _fuelRequestRepository
           .Query()
           .Include(x => x.Car)
           .FirstOrDefaultAsync(x => x.Id == requestId)
           ?? throw new NotFoundException("Request not found");

        if (request.Car.UserId != userId)
            new ForbiddenException("Invalid user for this request");

        request.Status = RequestStatus.SendCar;

        await _fuelRequestRepository.UpdateAsync(request);
    }

    public async Task CancelRequestAsync(Guid userId, Guid requestId, CancelRequestDTO dto)
    {
        var request = await _fuelRequestRepository
           .Query()
           .Include(x => x.Car)
           .FirstOrDefaultAsync(x => x.Id == requestId)
           ?? throw new NotFoundException("Request not found");

        if (request.Car.UserId != userId)
            new ForbiddenException("Invalid user for this request");

        request.Status = RequestStatus.Cancelled;
        request.CancelReason = dto.Reason;

        await _fuelRequestRepository.UpdateAsync(request);
    }

    public async Task<List<FuelRequestDTO>> GetFuelRequestsAsync(Guid userId)
    {
        var requests = await _fuelRequestRepository
            .Query()
            .Include(x => x.Car)
            .ThenInclude(x => x.User)
            .Include(x => x.Route)
            .Where(x => x.Car.UserId == userId && (x.Status == RequestStatus.Completed || x.Status == RequestStatus.Cancelled || x.Status == RequestStatus.SendCar))
            .ToListAsync();

        return _mapper.Map<List<FuelRequestDTO>>(requests);
    }
}