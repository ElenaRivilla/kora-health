using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.EntityFramework
{
    public static class BaseContextExtension
    {
        public static DbSet<T> GetDbSet<T>(this DbContext context) where T : class
        {
            return context.Set<T>();
        }
    }
}
