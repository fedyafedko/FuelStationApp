using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelStation.DAL.Configurations.Base;

public abstract class BaseEntityTypeConfiguration<T> : IEntityTypeConfiguration<T>
    where T : class
{
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
        builder.HasKey("Id");
        builder.ToTable(typeof(T).Name);
        ConfigureInternal(builder);
    }

    protected abstract void ConfigureInternal(EntityTypeBuilder<T> builder);
}