using FuelStation.Common.Enums;
using FuelStation.Common.Models.DTOs.Car;
using FuelStation.Common.Models.DTOs.Location;
using FuelStation.Common.Models.DTOs.Robot;
using FuelStation.Common.Models.DTOs.Route;

namespace FuelStation.Common.Models.DTOs.FuelRequest;

public class FuelRequestDTO
{
    public Guid Id { get; set; }
    public Guid CarId { get; set; }
    public RequestStatus Status { get; set; }
    public double RequestedLiters { get; set; }
    public decimal TotalPrice { get; set; }
    public string? CancelReason { get; set; }
    public DateTime CreateAt { get; set; }
    public RouteDTO Route { get; set; }
    public CarDTO Car { get; set; }
    public RobotDTO Robot { get; set; }
    public LocationDTO Location { get; set; }
}