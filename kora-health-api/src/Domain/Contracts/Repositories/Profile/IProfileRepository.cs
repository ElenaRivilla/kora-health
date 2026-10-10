namespace KoraHealth.Domain.Contracts.Repositories.Profile;

public interface IProfileRepository
{
    Task<string> GetTimeZoneIdAsync(int userId);
    Task SetTimeZoneIdAsync(int userId, string timeZoneId);
}
