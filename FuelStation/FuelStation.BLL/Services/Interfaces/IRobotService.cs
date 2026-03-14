using FuelStation.Common.Models.DTOs.Robot;

namespace FuelStation.BLL.Services.Interfaces;

public interface IRobotService
{
    Task<RobotDTO> CreateRobotAsync(CreateRobotDTO dto);
    Task<List<RobotDTO>> GetAllRobotsAsync();
}