using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Enums;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.DTOs.Robot;
using FuelStation.Common.Models.DTOs.Route;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Runtime.ConstrainedExecution;

namespace FuelStation.BLL.Services;

public class RobotService : IRobotService
{
    private readonly IRepository<Robot> _robotRepository;
    private readonly IRepository<FuelRequest> _fuelRequestRepository;
    private readonly ILocationService _locationService;
    private readonly IMapper _mapper;

    public RobotService(
        IRepository<Robot> robotRepository,
        IMapper mapper,
        ILocationService locationService,
        IRepository<FuelRequest> fuelRequestRepository)
    {
        _robotRepository = robotRepository;
        _mapper = mapper;
        _locationService = locationService;
        _fuelRequestRepository = fuelRequestRepository;
    }

    public async Task<RobotDTO> CreateRobotAsync(CreateRobotDTO dto)
    {
        var robot = _mapper.Map<Robot>(dto);

        var locationId = await _locationService.GetOrCreateLocationIdAsync(dto.CurrentLocation);
        robot.CurrentLocationId = locationId;
        robot.BatteryLevel = 100;
        robot.Status = RobotStatus.Idle;

        var result = await _robotRepository.InsertAsync(robot);

        if (!result)
            throw new ExternalException("Can not create new robot");

        return _mapper.Map<RobotDTO>(robot);
    }

    public async Task<RobotDTO> UpdateRobotAsync(Guid robotId, UpdateRobotDTO dto)
    {
        var robot = await _robotRepository.FirstOrDefaultAsync(x => x.Id == robotId)
            ?? throw new NotFoundException("Robot not found");

        _mapper.Map(dto, robot);

        var locationId = await _locationService.GetOrCreateLocationIdAsync(dto.CurrentLocation);
        robot.CurrentLocationId = locationId;

        var result = await _robotRepository.UpdateAsync(robot);

        if (!result)
            throw new ExternalException("Can not update new robot");

        return _mapper.Map<RobotDTO>(robot);
    }

    public async Task<bool> DeleteRobotAsync(Guid robotId)
    {
        var car = await _robotRepository
            .FirstOrDefaultAsync(x => x.Id == robotId)
            ?? throw new NotFoundException("Robot not found");

        var result = await _robotRepository.DeleteAsync(car);

        if (!result)
            throw new ExternalException($"Can not delete robot. RobotId: {robotId}");

        return result;
    }

    public async Task<List<RobotDTO>> GetAllRobotsAsync()
    {
        var robots =  _robotRepository
            .Include(x => x.CurrentLocation)
            .ToList();
        return _mapper.Map<List<RobotDTO>>(robots);
    }

    public async Task<RouteDTO> GetRobotRouteAsync(Guid robotId)
    {
        var route = await _fuelRequestRepository
            .Include(x => x.Route)
            .Where(x => x.CompletedAt != null && x.RobotId == robotId)
            .OrderByDescending(x => x.CompletedAt)
            .Select(x => x.Route)
            .FirstOrDefaultAsync();

        return _mapper.Map<RouteDTO>(route);
    }

    public async Task ArrivedAsync(Guid robotId)
    {
        var fuelRequest = await _fuelRequestRepository
            .Include(x => x.Route)
            .Include(x => x.Robot)
            .Where(x => x.RobotId == robotId && x.CompletedAt == null)
            .OrderByDescending(x => x.CompletedAt)
            .FirstOrDefaultAsync();

        if (fuelRequest == null)
            return;

        if (fuelRequest.Route == null || fuelRequest.Robot == null)
            return;

        var batteryUsage = CalculateRequiredBattery(fuelRequest.Route.Distance / 1000.0);

        fuelRequest.Robot.BatteryLevel -= batteryUsage * 2;

        if (fuelRequest.Robot.BatteryLevel < 0)
            fuelRequest.Robot.BatteryLevel = 0;

        fuelRequest.Robot.Status = RobotStatus.Idle;

        await _robotRepository.UpdateAsync(fuelRequest.Robot);
    }

    private double CalculateRequiredBattery(double distanceKm)
    {
        const double batteryPerKm = 3;
        return distanceKm * batteryPerKm;
    }
}