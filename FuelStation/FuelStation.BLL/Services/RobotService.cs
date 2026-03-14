using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Enums;
using FuelStation.Common.Exceptions;
using FuelStation.Common.Models.DTOs.Robot;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FuelStation.BLL.Services;

public class RobotService : IRobotService
{
    private readonly IRepository<Robot> _robotRepository;
    private readonly ILocationService _locationService;
    private readonly IMapper _mapper;

    public RobotService(
        IRepository<Robot> robotRepository,
        IMapper mapper,
        ILocationService locationService)
    {
        _robotRepository = robotRepository;
        _mapper = mapper;
        _locationService = locationService;
    }

    public async Task<RobotDTO> CreateRobotAsync(CreateRobotDTO dto)
    {
        var robot = _mapper.Map<Robot>(dto);

        var locationId = await _locationService.GetOrCreateLocationIdAsync(dto.CurrentLocation);
        robot.CurrentLocationId = locationId;
        robot.Status = RobotStatus.Idle;

        var result = await _robotRepository.InsertAsync(robot);

        if (!result)
            throw new ExternalException("Can not create new robot");

        return _mapper.Map<RobotDTO>(robot);
    }

    public async Task<List<RobotDTO>> GetAllRobotsAsync()
    {
        var robots =  _robotRepository
            .Query()
            .Include(x => x.CurrentLocation)
            .ToList();
        return _mapper.Map<List<RobotDTO>>(robots);
    }
}