namespace FuelStation.DAL.Entities;

public class Route : BaseEntity
{
    public Guid FuelRequestId { get; set; }
    public double StartLat { get; set; }
    public double StartLng { get; set; }
    public double EndLat { get; set; }
    public double EndLng { get; set; }
    public double Distance { get; set; }
    public double Duration { get; set; }
    public string Geometry { get; set; }
    public DateTime CreatedAt { get; set; }

    public FuelRequest FuelRequest { get; set; }
}
