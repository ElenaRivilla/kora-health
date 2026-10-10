using AutoMapper;
using KoraHealth.Domain.Contracts.Repositories.WaterTracking;
using KoraHealth.Domain.Contracts.Services.LocalDay;
using KoraHealth.Domain.Contracts.Services.WaterTracking;
using KoraHealth.Domain.Models.WaterTracking;

namespace KoraHealth.Application.Services.WaterTracking;

public class WaterTrackingService : IWaterTrackingService
{
    private readonly IWaterTrackingRepository _waterTrackingRepository;
    private readonly ILocalDayService _localDayService;
    private readonly IMapper _mapper;

    public WaterTrackingService(IWaterTrackingRepository waterTrackingRepository, ILocalDayService localDayService, IMapper mapper)
    {
        _waterTrackingRepository = waterTrackingRepository;
        _localDayService = localDayService;
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

        // Days are the user's local days: the window ends today and each entry counts on the day it was logged for them.
        var calendar = await _localDayService.GetCalendarAsync(userId);
        var firstDay = calendar.Today.AddDays(-(days - 1));
        var (sinceUtc, _) = calendar.GetUtcRange(firstDay, calendar.Today);

        var entries = await _waterTrackingRepository.GetEntriesSinceAsync(userId, sinceUtc);
        var goal = await _waterTrackingRepository.GetGoalAsync(userId);

        return entries
            .GroupBy(e => calendar.GetLocalDay(e.DateCreated))
            // Safeguard: the result stays within the window even if the lower bound was too wide.
            .Where(g => g.Key >= firstDay)
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
