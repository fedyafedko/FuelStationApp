using FuelStation.Common.Models.DTOs.Location;

namespace FuelStation.Common.Models.DTOs.Robot;

public class CreateRobotDTO
{
    public double TankCapacity { get; set; }
    public double BatteryLevel { get; set; }
    public string UniqueNumber { get; set; }

    public CreateLocationDTO CurrentLocation { get; set; }
}
