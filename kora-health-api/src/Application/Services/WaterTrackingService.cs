using KoraHealth.Domain.Contracts.Repositories;
using KoraHealth.Domain.Contracts.Services;
using KoraHealth.Domain.Entities.DTOs;

namespace KoraHealth.Application.Services;

public class WaterTrackingService : IWaterTrackingService
{
    private readonly IWaterTrackingRepository _waterTrackingRepository;

    public WaterTrackingService(IWaterTrackingRepository waterTrackingRepository)
    {
        _waterTrackingRepository = waterTrackingRepository;
    }

    public async Task<WaterGoal?> GetGoalAsync(int userId)
    {
        var goal = await _waterTrackingRepository.GetGoalAsync(userId);
        if (goal is null) return null;

        return new WaterGoal
        {
            DailyGoalMl = goal.DailyGoalMl,
            DateUpdated = goal.DateUpdated
        };
    }

    public async Task<WaterGoal> SetGoalAsync(int userId, WaterGoal goal)
    {
        await _waterTrackingRepository.SetGoalAsync(userId, goal.DailyGoalMl);
        var updated = await _waterTrackingRepository.GetGoalAsync(userId);

        return new WaterGoal
        {
            DailyGoalMl = updated!.DailyGoalMl,
            DateUpdated = updated.DateUpdated
        };
    }

    public async Task<WaterEntry> LogEntryAsync(int userId, WaterEntry entry)
    {
        var saved = await _waterTrackingRepository.AddEntryAsync(userId, entry.AmountMl);

        return new WaterEntry
        {
            Id = saved.Id,
            AmountMl = saved.AmountMl,
            DateCreated = saved.DateCreated
        };
    }

    public async Task<List<WaterHistoryDay>> GetHistoryAsync(int userId, int days)
    {
        var sinceUtc = DateTime.UtcNow.Date.AddDays(-(days - 1));
        var entries = await _waterTrackingRepository.GetEntriesSinceAsync(userId, sinceUtc);
        var goal = await _waterTrackingRepository.GetGoalAsync(userId);

        return entries
            .GroupBy(e => DateOnly.FromDateTime(e.DateCreated))
            .Select(g => new WaterHistoryDay
            {
                Date = g.Key,
                TotalMl = g.Sum(e => e.AmountMl),
                GoalMl = goal?.DailyGoalMl
            })
            .OrderByDescending(d => d.Date)
            .ToList();
    }
}
