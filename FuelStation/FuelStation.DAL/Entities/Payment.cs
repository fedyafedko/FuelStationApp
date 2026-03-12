using FuelStation.Common.Enums;

namespace FuelStation.DAL.Entities;

public class Payment : BaseEntity
{
    public Guid FuelRequestId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }

    public FuelRequest FuelRequest { get; set; }
}
