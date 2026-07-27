using KoraHealth.Domain.Models.WaterTracking;

namespace KoraHealth.Domain.Contracts.Services.WaterTracking;

public interface IWaterTrackingService
{
    Task<WaterGoal?> GetGoalAsync(int userId);
    Task<WaterGoal?> SetGoalAsync(int userId, WaterGoal goal);
    Task<WaterEntry> LogEntryAsync(int userId, WaterEntry entry);
    Task<List<WaterHistoryDay>> GetHistoryAsync(int userId, int days);
}
