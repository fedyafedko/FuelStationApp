using FuelStation.Common.Models.DTOs.Robot;
using FuelStation.Common.Models.DTOs.Route;

namespace FuelStation.BLL.Services.Interfaces;

public interface IRobotService
{
    Task ArrivedAsync(Guid robotId);
    Task<RobotDTO> CreateRobotAsync(CreateRobotDTO dto);
    Task<bool> DeleteRobotAsync(Guid robotId);
    Task<List<RobotDTO>> GetAllRobotsAsync();
    Task<RouteDTO> GetRobotRouteAsync(Guid robotId);
    Task<RobotDTO> UpdateRobotAsync(Guid robotId, UpdateRobotDTO dto);
}