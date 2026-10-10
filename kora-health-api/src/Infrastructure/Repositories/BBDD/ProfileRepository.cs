using KoraHealth.Domain.Contracts.Repositories.Profile;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;

namespace KoraHealth.Infrastructure.Repositories.BBDD;

public class ProfileRepository : IProfileRepository
{
    private readonly KoraHealthDbContext _db;

    public ProfileRepository(KoraHealthDbContext db)
    {
        _db = db;
    }

    public Task<string> GetTimeZoneIdAsync(int userId) =>
        _db.Users.Where(u => u.Id == userId).Select(u => u.TimeZoneId).SingleAsync();

    public async Task SetTimeZoneIdAsync(int userId, string timeZoneId)
    {
        var user = await _db.Users.SingleAsync(u => u.Id == userId);

        user.TimeZoneId = timeZoneId;

        await _db.SaveChangesAsync();
    }
}
