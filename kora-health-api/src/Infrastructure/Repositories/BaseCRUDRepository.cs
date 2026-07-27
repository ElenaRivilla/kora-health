using KoraHealth.Domain.Contracts.Repositories;
using KoraHealth.Domain.Models;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.Repositories
{
    public abstract class BaseCRUDRepository<T> : IBaseCRUDRepository<T> where T : BaseModel
    {
        protected readonly DbContext _context;

        public BaseCRUDRepository(DbContext context)
        {
            _context = context;
        }

        public async Task<int> Create(T entity)
        {
            try
            {
                var newEntity = _context.GetDbSet<T>().Add(entity);
                await _context.SaveChangesAsync();
                return newEntity.Entity.Id;
            }
            catch (Exception)
            {
                _context.Entry(entity).State = EntityState.Detached;
                throw;
            }

        }

        public Task<T> Read(int id)
        {
            return _context.GetDbSet<T>().FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task Update(T entity)
        {
            _context.GetDbSet<T>().Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task Delete(int id)
        {
            T entity = await _context.GetDbSet<T>().SingleOrDefaultAsync(e => e.Id == id);
            _context.GetDbSet<T>().Remove(entity);
            await _context.SaveChangesAsync();
        }

        public Task<List<T>> All()
        {
            return _context.GetDbSet<T>().ToListAsync();
        }
    }
}
