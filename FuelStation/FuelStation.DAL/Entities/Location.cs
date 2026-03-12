namespace FuelStation.DAL.Entities;

public class Location : BaseEntity
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public List<FuelRequest> FuelRequests { get; set; }
}
