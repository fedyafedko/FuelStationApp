using FuelStation.Common.Enums;

namespace FuelStation.DAL.Entities;

public class Robot : BaseEntity
{
    public Guid? CurrentLocationId { get; set; }
    public RobotStatus Status { get; set; }
    public double TankCapacity { get; set; }
    public double BatteryLevel { get; set; }
    public string UniqueNumber { get; set; }

    public Location? CurrentLocation { get; set; }
    public List<FuelRequest> FuelRequests { get; set; }
}
