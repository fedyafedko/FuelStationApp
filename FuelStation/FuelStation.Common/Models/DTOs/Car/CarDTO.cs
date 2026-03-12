using FuelStation.Common.Enums;

namespace FuelStation.Common.Models.DTOs.Car;

public class CarDTO
{
    public Guid Id { get; set; }
    public string Mark { get; set; }
    public string Model { get; set; }
    public float EngineCapacity { get; set; }
    public string CarNumber { get; set; }
    public double TankCapacity { get; set; }
    public Guid UserId { get; set; }
    public FuelType FuelType { get; set; }
}