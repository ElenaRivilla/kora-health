using KoraHealth.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.EntityFramework;

public class KoraHealthDbContext(DbContextOptions<KoraHealthDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<WaterGoal> WaterGoals => Set<WaterGoal>();
    public DbSet<WaterEntry> WaterEntries => Set<WaterEntry>();
}
