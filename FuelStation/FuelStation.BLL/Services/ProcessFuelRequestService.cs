using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Enums;
using FuelStation.Common.Models.Routes;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FuelStation.BLL.Services;

public class ProcessFuelRequestService : IProcessFuelRequestService
{
    private readonly IRepository<FuelRequest> _fuelRequestRepository;
    private readonly IRepository<Robot> _robotRepository;
    private readonly IRepository<DAL.Entities.Route> _routeRepository;
    private readonly IMapper _mapper;

    public ProcessFuelRequestService(
        IRepository<FuelRequest> fuelRequestRepository,
        IRepository<Robot> robotRepository,
        IRepository<DAL.Entities.Route> routeRepository,
        IMapper mapper)
    {
        _fuelRequestRepository = fuelRequestRepository;
        _robotRepository = robotRepository;
        _routeRepository = routeRepository;
        _mapper = mapper;
    }

    public async Task AssignRobotToRequest()
    {
        var fuelRequests = await _fuelRequestRepository
            .Query()
            .Include(x => x.Location)
            .Where(x => x.Status == RequestStatus.Pending)
            .ToListAsync();

        var robots = await _robotRepository
            .Query()
            .Include(x => x.CurrentLocation)
            .Where(x => x.Status == RobotStatus.Idle)
            .ToListAsync();

        foreach (var request in fuelRequests)
        {
            if (request.Location == null)
                continue;

            var availableRobots = robots
                .Where(r =>
                    r.TankCapacity >= request.RequestedLiters &&
                    r.CurrentLocation != null)
                .Select(async r =>
                {
                    var osrmResponse = await GetRouteFromOsrm(
                        r.CurrentLocation.Latitude,
                        r.CurrentLocation.Longitude,
                        request.Location.Latitude,
                        request.Location.Longitude);

                    if (osrmResponse == null || osrmResponse.Routes.Count == 0)
                        return null;

                    var routeDistance = osrmResponse.Routes[0].Distance;
                    var oneWayBattery = CalculateRequiredBattery(routeDistance / 1000.0);
                    var requiredBattery = oneWayBattery * 2.0;

                    return new
                    {
                        Robot = r,
                        RouteResponse = osrmResponse,
                        Distance = routeDistance,
                        RequiredBattery = requiredBattery
                    };
                });

            var availableResults = await Task.WhenAll(availableRobots);
            var suitableRobot = availableResults
                .Where(x => x != null)
                .Where(x =>
                {
                    if (x.RequiredBattery > 100)
                    {
                        return false;
                    }
                    return x.Robot.BatteryLevel >= x.RequiredBattery;
                })
                .OrderBy(x => x.Distance)
                .FirstOrDefault();

            if (suitableRobot == null)
            {
                if (availableResults.Any(x => x != null && x.RequiredBattery > 100) && request.CreateAt.AddMinutes(5) <= DateTime.UtcNow)
                    request.Status = RequestStatus.RobotUnavailable;

                continue;
            }

            request.RobotId = suitableRobot.Robot.Id;
            request.Status = RequestStatus.InProgress;
            suitableRobot.Robot.Status = RobotStatus.Busy;

            var routeEntity = _mapper.Map<DAL.Entities.Route>(suitableRobot.RouteResponse);
            routeEntity.FuelRequestId = request.Id;
            await _routeRepository.InsertAsync(routeEntity, false);

            robots.Remove(suitableRobot.Robot);
        }

        await _fuelRequestRepository.SaveChangesAsync();
        await _routeRepository.SaveChangesAsync();
    }

    private double CalculateRequiredBattery(double distanceKm)
    {
        const double batteryPerKm = 3;
        return distanceKm * batteryPerKm;
    }

    // Run Docker
    private async Task<OsrmResponse> GetRouteFromOsrm(double startLat, double startLng, double endLat, double endLng)
    {
        using var httpClient = new HttpClient();
        var url = $"http://localhost:5000/route/v1/driving/{startLng},{startLat};{endLng},{endLat}?overview=full";
        var response = await httpClient.GetStringAsync(url);

        return JsonSerializer.Deserialize<OsrmResponse>(response);
    }
}