using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class RobotConfiguration : BaseEntityTypeConfiguration<Robot>
{
    protected override void ConfigureInternal(EntityTypeBuilder<Robot> builder)
    {
        builder.HasOne(c => c.CurrentLocation)
            .WithMany()
            .HasForeignKey(c => c.CurrentLocationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}