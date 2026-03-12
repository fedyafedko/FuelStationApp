using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class UserConfiguration : BaseEntityTypeConfiguration<User>
{
    protected override void ConfigureInternal(EntityTypeBuilder<User> builder) { }
}