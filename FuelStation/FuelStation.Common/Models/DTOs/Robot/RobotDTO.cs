using FuelStation.Common.Enums;
using FuelStation.Common.Models.DTOs.Location;

namespace FuelStation.Common.Models.DTOs.Robot;

public class RobotDTO
{
    public Guid Id { get; set; }
    public RobotStatus Status { get; set; }
    public double TankCapacity { get; set; }
    public double BatteryLevel { get; set; }

    public LocationDTO? CurrentLocation { get; set; }
}