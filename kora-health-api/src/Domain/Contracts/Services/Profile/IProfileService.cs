using KoraHealth.Domain.Models.Profile;

namespace KoraHealth.Domain.Contracts.Services.Profile;

public interface IProfileService
{
    Task<UserTimeZone> GetTimeZoneAsync(int userId);

    // Returns the stored time zone, or null when the requested one is not valid (nothing is changed).
    Task<UserTimeZone?> SetTimeZoneAsync(int userId, UserTimeZone timeZone);
}
