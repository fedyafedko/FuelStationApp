using FuelStation.Common.Enums;

namespace FuelStation.DAL.Entities;

public class FuelRequest : BaseEntity
{
    public Guid? RobotId { get; set; }
    public Guid CarId { get; set; }
    public RequestStatus Status { get; set; }
    public Guid? LocationId { get; set; }
    public DateTime CreateAt { get; set; }
    public double RequestedLiters { get; set; }
    public decimal PricePerLiter { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CancelReason { get; set; }
    public Guid PaymentId {  get; set; }
    public bool IsConfirmed { get; set; }

    public Robot? Robot { get; set; }
    public Car Car { get; set; }
    public Location? Location { get; set; }
    public Payment Payment { get; set; }
    public Route Route { get; set; }
}
