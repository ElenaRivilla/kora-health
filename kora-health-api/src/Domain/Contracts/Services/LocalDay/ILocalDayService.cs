using KoraHealth.Domain.LocalDay;

namespace KoraHealth.Domain.Contracts.Services.LocalDay;

public interface ILocalDayService
{
    // The user's calendar as of now, in their time zone.
    Task<UserCalendar> GetCalendarAsync(int userId);
}
