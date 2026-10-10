using KoraHealth.Domain.Contracts.Repositories.Profile;

namespace KoraHealth.Application.Tests.TestDoubles;

// Keeps the time zone of a single user in memory; it stores whatever it is given, valid or not.
public sealed class InMemoryProfileRepository : IProfileRepository
{
    public InMemoryProfileRepository(string timeZoneId)
    {
        TimeZoneId = timeZoneId;
    }

    public string TimeZoneId { get; set; }

    public Task<string> GetTimeZoneIdAsync(int userId) => Task.FromResult(TimeZoneId);

    public Task SetTimeZoneIdAsync(int userId, string timeZoneId)
    {
        TimeZoneId = timeZoneId;

        return Task.CompletedTask;
    }
}
