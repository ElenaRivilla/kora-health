using KoraHealth.Domain.Entities.User;
using KoraHealth.Domain.Entities.WaterTracking;
using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.EntityFramework;

public class KoraHealthDbContext(DbContextOptions<KoraHealthDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<WaterGoalEntity> WaterGoals => Set<WaterGoalEntity>();
    public DbSet<WaterEntryEntity> WaterEntries => Set<WaterEntryEntity>();
}
