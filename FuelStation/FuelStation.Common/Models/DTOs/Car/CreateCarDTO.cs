using FuelStation.Common.Enums;

namespace FuelStation.Common.Models.DTOs.Car;

public class CreateCarDTO
{
    public string Mark { get; set; }
    public string Model { get; set; }
    public float EngineCapacity { get; set; }
    public string CarNumber { get; set; }
    public double TankCapacity { get; set; }
    public FuelType FuelType { get; set; }
}
