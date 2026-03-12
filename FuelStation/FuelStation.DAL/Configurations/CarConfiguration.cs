using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class CarConfiguration : BaseEntityTypeConfiguration<Car>
{
    protected override void ConfigureInternal(EntityTypeBuilder<Car> builder) { }
}