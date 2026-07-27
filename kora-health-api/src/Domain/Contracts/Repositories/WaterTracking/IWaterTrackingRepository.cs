using KoraHealth.Domain.Entities.WaterTracking;

namespace KoraHealth.Domain.Contracts.Repositories.WaterTracking;

public interface IWaterTrackingRepository
{
    Task<WaterGoalEntity?> GetGoalAsync(int userId);
    Task SetGoalAsync(int userId, int dailyGoalMl);
    Task<WaterEntryEntity> AddEntryAsync(int userId, int amountMl);
    Task<List<WaterEntryEntity>> GetEntriesSinceAsync(int userId, DateTime sinceUtc);
}
