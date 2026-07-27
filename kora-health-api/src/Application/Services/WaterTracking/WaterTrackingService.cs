using AutoMapper;
using KoraHealth.Domain.Contracts.Repositories.WaterTracking;
using KoraHealth.Domain.Contracts.Services.WaterTracking;
using KoraHealth.Domain.Models.WaterTracking;

namespace KoraHealth.Application.Services.WaterTracking;

public class WaterTrackingService : IWaterTrackingService
{
    private readonly IWaterTrackingRepository _waterTrackingRepository;
    private readonly IMapper _mapper;

    public WaterTrackingService(IWaterTrackingRepository waterTrackingRepository, IMapper mapper)
    {
        _waterTrackingRepository = waterTrackingRepository;
        _mapper = mapper;
    }

    public async Task<WaterGoal?> GetGoalAsync(int userId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));

        return _mapper.Map<WaterGoal?>(await _waterTrackingRepository.GetGoalAsync(userId)) ?? null;
    }

    public async Task<WaterGoal?> SetGoalAsync(int userId, WaterGoal goal)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));
        ArgumentNullException.ThrowIfNull(goal, nameof(goal));

        await _waterTrackingRepository.SetGoalAsync(userId, goal.DailyGoalMl);

        return _mapper.Map<WaterGoal>(await _waterTrackingRepository.GetGoalAsync(userId)) ?? null;
    }

    public async Task<WaterEntry> LogEntryAsync(int userId, WaterEntry entry)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));
        ArgumentNullException.ThrowIfNull(entry, nameof(entry));

        return _mapper.Map<WaterEntry>(await _waterTrackingRepository.AddEntryAsync(userId, entry.AmountMl));
    }

    public async Task<List<WaterHistoryDay>> GetHistoryAsync(int userId, int days)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(days, nameof(days));

        var entries = await _waterTrackingRepository.GetEntriesSinceAsync(userId, DateTime.UtcNow.Date.AddDays(-(days - 1)));
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
