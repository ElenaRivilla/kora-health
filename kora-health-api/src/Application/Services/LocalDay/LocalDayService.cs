using KoraHealth.Domain.Contracts.Repositories.Profile;
using KoraHealth.Domain.Contracts.Services.LocalDay;
using KoraHealth.Domain.LocalDay;

namespace KoraHealth.Application.Services.LocalDay;

public class LocalDayService : ILocalDayService
{
    private readonly IProfileRepository _profileRepository;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<LocalDayService> _logger;

    public LocalDayService(IProfileRepository profileRepository, TimeProvider timeProvider, ILogger<LocalDayService> logger)
    {
        _profileRepository = profileRepository;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<UserCalendar> GetCalendarAsync(int userId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));

        var storedTimeZoneId = await _profileRepository.GetTimeZoneIdAsync(userId);

        // A stored zone this machine cannot resolve must not break every query of the user.
        if (!TimeZoneValidator.TryNormalize(storedTimeZoneId, out var timeZoneId))
        {
            _logger.LogWarning(
                "User {UserId} has a stored time zone that cannot be resolved ({StoredTimeZoneId}); using {DefaultTimeZoneId} instead.",
                userId, storedTimeZoneId, TimeZoneDefaults.DefaultTimeZoneId);

            timeZoneId = TimeZoneDefaults.DefaultTimeZoneId;
        }

        return new UserCalendar(TimeZoneInfo.FindSystemTimeZoneById(timeZoneId), _timeProvider.GetUtcNow());
    }
}
