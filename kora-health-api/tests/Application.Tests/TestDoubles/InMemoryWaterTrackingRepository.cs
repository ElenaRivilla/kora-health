using KoraHealth.Domain.Contracts.Repositories.WaterTracking;
using KoraHealth.Domain.Entities.WaterTracking;

namespace KoraHealth.Application.Tests.TestDoubles;

// Keeps the water entries and the goal of a single user in memory, and remembers the lower bound it was last asked for.
public sealed class InMemoryWaterTrackingRepository : IWaterTrackingRepository
{
    private readonly List<WaterEntryEntity> _entries = [];
    private WaterGoalEntity? _goal;

    // When set, the lower bound is ignored and every entry is returned, as a repository with too wide a bound would do.
    public bool IgnoreLowerBound { get; set; }

    public DateTime? LastSinceUtc { get; private set; }

    public void AddEntryAt(DateTime utcInstant, int amountMl) =>
        _entries.Add(new WaterEntryEntity { Id = _entries.Count + 1, UserId = 1, AmountMl = amountMl, DateCreated = utcInstant });

    public Task<WaterGoalEntity?> GetGoalAsync(int userId) => Task.FromResult(_goal);

    public Task SetGoalAsync(int userId, int dailyGoalMl)
    {
        _goal = new WaterGoalEntity { Id = 1, UserId = userId, DailyGoalMl = dailyGoalMl, DateUpdated = DateTime.UtcNow };

        return Task.CompletedTask;
    }

    public Task<WaterEntryEntity> AddEntryAsync(int userId, int amountMl)
    {
        var entry = new WaterEntryEntity { Id = _entries.Count + 1, UserId = userId, AmountMl = amountMl, DateCreated = DateTime.UtcNow };
        _entries.Add(entry);

        return Task.FromResult(entry);
    }

    public Task<List<WaterEntryEntity>> GetEntriesSinceAsync(int userId, DateTime sinceUtc)
    {
        LastSinceUtc = sinceUtc;

        return Task.FromResult(_entries
            .Where(e => IgnoreLowerBound || e.DateCreated >= sinceUtc)
            .OrderByDescending(e => e.DateCreated)
            .ToList());
    }
}
