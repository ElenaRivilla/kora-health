using KoraHealth.Domain.Contracts.Repositories.Profile;
using KoraHealth.Domain.Contracts.Services.Profile;
using KoraHealth.Domain.LocalDay;
using KoraHealth.Domain.Models.Profile;

namespace KoraHealth.Application.Services.Profile;

public class ProfileService : IProfileService
{
    private readonly IProfileRepository _profileRepository;

    public ProfileService(IProfileRepository profileRepository)
    {
        _profileRepository = profileRepository;
    }

    public async Task<UserTimeZone> GetTimeZoneAsync(int userId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));

        return new UserTimeZone { TimeZoneId = await _profileRepository.GetTimeZoneIdAsync(userId) };
    }

    public async Task<UserTimeZone?> SetTimeZoneAsync(int userId, UserTimeZone timeZone)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId, nameof(userId));
        ArgumentNullException.ThrowIfNull(timeZone, nameof(timeZone));

        if (!TimeZoneValidator.TryNormalize(timeZone.TimeZoneId, out var timeZoneId)) return null;

        await _profileRepository.SetTimeZoneIdAsync(userId, timeZoneId);

        return await GetTimeZoneAsync(userId);
    }
}
