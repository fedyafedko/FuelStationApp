using FuelStation.Common.Models.DTOs.Location;

namespace FuelStation.Common.Models.DTOs.Robot;

public class UpdateRobotDTO
{
    public double TankCapacity { get; set; }
    public string UniqueNumber { get; set; }

    public CreateLocationDTO CurrentLocation { get; set; }
}