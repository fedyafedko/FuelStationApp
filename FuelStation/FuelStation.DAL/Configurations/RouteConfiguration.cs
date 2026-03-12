using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class RouteConfiguration : BaseEntityTypeConfiguration<Route>
{
    protected override void ConfigureInternal(EntityTypeBuilder<Route> builder)
    {
        builder.HasOne(r => r.FuelRequest)
               .WithOne(fr => fr.Route)
               .HasForeignKey<Route>(p => p.FuelRequestId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
