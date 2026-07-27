using KoraHealth.Domain.Models;

namespace KoraHealth.Domain.Contracts.Repositories
{
    public interface IBaseCRUDRepository<T> where T : BaseModel
    {
        Task<List<T>> All();
        Task<int> Create(T entity);
        Task<T> Read(int id);
        Task Update(T entity);
        Task Delete(int id);
    }
}
