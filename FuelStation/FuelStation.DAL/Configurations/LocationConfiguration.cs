using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class LocationConfiguration : BaseEntityTypeConfiguration<Location>
{
    protected override void ConfigureInternal(EntityTypeBuilder<Location> builder) { }
}
