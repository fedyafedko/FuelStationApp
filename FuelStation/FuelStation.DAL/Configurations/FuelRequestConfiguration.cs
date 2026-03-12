using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class FuelRequestConfiguration : BaseEntityTypeConfiguration<FuelRequest>
{
    protected override void ConfigureInternal(EntityTypeBuilder<FuelRequest> builder)
    {
        builder.HasOne(fr => fr.Car)
               .WithMany(c => c.FuelRequests)
               .HasForeignKey(fr => fr.CarId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fr => fr.Robot)
               .WithMany(r => r.FuelRequests)
               .HasForeignKey(fr => fr.RobotId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fr => fr.Location)
               .WithMany(l => l.FuelRequests)
               .HasForeignKey(fr => fr.LocationId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(fr => fr.Payment)
               .WithOne(p => p.FuelRequest)
               .HasForeignKey<Payment>(p => p.FuelRequestId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
