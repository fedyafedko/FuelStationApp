using FuelStation.Common.Enums;

namespace FuelStation.DAL.Entities;

public class Car : BaseEntity
{
    public string Mark {  get; set; }
    public string Model { get; set;  }
    public float EngineCapacity { get; set; }
    public string CarNumber { get; set; }
    public double TankCapacity { get; set; }
    public Guid UserId { get; set; }
    public FuelType FuelType { get; set; }

    public User User { get; set; }
    public List<FuelRequest> FuelRequests { get; set; }
}
