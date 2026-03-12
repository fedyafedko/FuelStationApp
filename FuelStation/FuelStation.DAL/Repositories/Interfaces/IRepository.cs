namespace FuelStation.DAL.Repositories.Interfaces;

public interface IRepository<TEntity> : IQueryable<TEntity>
{
    IQueryable<TEntity> FromSqlInterpolated(FormattableString sql);

    Task<bool> InsertAsync(TEntity entity, bool persist = true);

    bool Insert(TEntity entity, bool persist = true);

    Task<bool> InsertManyAsync(IEnumerable<TEntity> entities, bool persist = true);

    bool InsertMany(IEnumerable<TEntity> entities, bool persist = true);

    Task<bool> UpdateAsync(TEntity entity, bool persist = true);

    bool Update(TEntity entity, bool persist = true);

    Task<bool> UpdateManyAsync(IEnumerable<TEntity> entities, bool persist = true);

    bool UpdateMany(IEnumerable<TEntity> entities, bool persist = true);

    Task<bool> DeleteAsync(TEntity entity, bool persist = true);

    bool Delete(TEntity entity, bool persist = true);

    Task<bool> DeleteManyAsync(IEnumerable<TEntity> entities, bool persist = true);

    bool DeleteMany(IEnumerable<TEntity> entities, bool persist = true);

    Task<int> SaveChangesAsync();

    int SaveChanges();
    IQueryable<TEntity> Query();
}