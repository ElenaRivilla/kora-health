using KoraHealth.Domain.Models;

namespace KoraHealth.Domain.Contracts.Repositories;

public interface IWaterTrackingRepository
{
    Task<WaterGoal?> GetGoalAsync(int userId);
    Task SetGoalAsync(int userId, int dailyGoalMl);
    Task<WaterEntry> AddEntryAsync(int userId, int amountMl);
    Task<List<WaterEntry>> GetEntriesSinceAsync(int userId, DateTime sinceUtc);
}
