using FuelStation.Common.Models.DTOs.Location;

namespace FuelStation.Common.Models.DTOs.FuelRequest;

public class CreateFuelRequestDTO
{
    public Guid CarId { get; set; }
    public CreateLocationDTO Location { get; set; }
    public double RequestedLiters { get; set; }
}