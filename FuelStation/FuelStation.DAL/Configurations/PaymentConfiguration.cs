using FuelStation.DAL.Configurations.Base;
using FuelStation.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations;

public class PaymentConfiguration : BaseEntityTypeConfiguration<Payment>
{
    protected override void ConfigureInternal(EntityTypeBuilder<Payment> builder)
    {
        builder.HasOne(p => p.FuelRequest)
            .WithOne(fr => fr.Payment)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
