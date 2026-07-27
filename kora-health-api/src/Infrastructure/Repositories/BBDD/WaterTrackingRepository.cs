using KoraHealth.Domain.Contracts.Repositories.WaterTracking;
using KoraHealth.Domain.Entities.WaterTracking;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.Repositories.BBDD;

public class WaterTrackingRepository : IWaterTrackingRepository
{
    private readonly KoraHealthDbContext _db;

    public WaterTrackingRepository(KoraHealthDbContext db)
    {
        _db = db;
    }

    public Task<WaterGoalEntity?> GetGoalAsync(int userId) => _db.WaterGoals.SingleOrDefaultAsync(g => g.UserId == userId);

    public async Task SetGoalAsync(int userId, int dailyGoalMl)
    {
        var goal = await _db.WaterGoals.SingleOrDefaultAsync(g => g.UserId == userId);

        if (goal is null)
        {
            _db.WaterGoals.Add(new WaterGoalEntity
            {
                UserId = userId,
                DailyGoalMl = dailyGoalMl,
                DateUpdated = DateTime.UtcNow
            });
        }
        else
        {
            goal.DailyGoalMl = dailyGoalMl;
            goal.DateUpdated = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<WaterEntryEntity> AddEntryAsync(int userId, int amountMl)
    {
        var entry = new WaterEntryEntity
        {
            UserId = userId,
            AmountMl = amountMl,
            DateCreated = DateTime.UtcNow
        };
        _db.WaterEntries.Add(entry);
        await _db.SaveChangesAsync();
        return entry;
    }

    public Task<List<WaterEntryEntity>> GetEntriesSinceAsync(int userId, DateTime sinceUtc) =>
        _db.WaterEntries
            .Where(e => e.UserId == userId && e.DateCreated >= sinceUtc)
            .OrderByDescending(e => e.DateCreated)
            .ToListAsync();
}
