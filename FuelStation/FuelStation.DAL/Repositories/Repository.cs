using FuelStation.DAL.Contexts;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections;
using System.Linq.Expressions;

namespace FuelStation.DAL.Repositories;

public class Repository<TEntity> : IRepository<TEntity>
    where TEntity : class
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<TEntity> _table;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _table = _context.Set<TEntity>();
    }

    public Type ElementType => ((IQueryable<TEntity>)_table).ElementType;

    public Expression Expression => ((IQueryable<TEntity>)_table).Expression;

    public IQueryProvider Provider => ((IQueryable<TEntity>)_table).Provider;

    public IEnumerator<TEntity> GetEnumerator()
    {
        return ((IEnumerable<TEntity>)_table).GetEnumerator();
    }

    public IQueryable<TEntity> Query()
    {
        return _table.AsQueryable();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }

    public IQueryable<TEntity> FromSqlInterpolated(FormattableString sql)
    {
        return _table.FromSqlInterpolated(sql);
    }

    public async Task<bool> InsertAsync(TEntity entity, bool persist = true)
    {
        await _table.AddAsync(entity);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool Insert(TEntity entity, bool persist = true)
    {
        _table.Add(entity);
        return !persist || SaveChanges() > 0;
    }

    public async Task<bool> InsertManyAsync(IEnumerable<TEntity> entities, bool persist = true)
    {
        await _table.AddRangeAsync(entities);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool InsertMany(IEnumerable<TEntity> entities, bool persist = true)
    {
        _table.AddRange(entities);
        return !persist || SaveChanges() > 0;
    }

    public async Task<bool> UpdateAsync(TEntity entity, bool persist = true)
    {
        _table.Update(entity);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool Update(TEntity entity, bool persist = true)
    {
        _table.Update(entity);
        return !persist || SaveChanges() > 0;
    }

    public async Task<bool> UpdateManyAsync(IEnumerable<TEntity> entities, bool persist = true)
    {
        _table.UpdateRange(entities);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool UpdateMany(IEnumerable<TEntity> entities, bool persist = true)
    {
        _table.UpdateRange(entities);
        return !persist || SaveChanges() > 0;
    }

    public async Task<bool> DeleteAsync(TEntity entity, bool persist = true)
    {
        _table.Remove(entity);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool Delete(TEntity entity, bool persist = true)
    {
        _table.Remove(entity);
        return !persist || SaveChanges() > 0;
    }

    public async Task<bool> DeleteManyAsync(IEnumerable<TEntity> entities, bool persist = true)
    {
        _table.RemoveRange(entities);
        return !persist || await SaveChangesAsync() > 0;
    }

    public bool DeleteMany(IEnumerable<TEntity> entities, bool persist = true)
    {
        _table.RemoveRange(entities);
        return !persist || SaveChanges() > 0;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public int SaveChanges()
    {
        return _context.SaveChanges();
    }
}