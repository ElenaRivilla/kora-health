namespace KoraHealth.Domain.LocalDay;

// The calendar of a user at a given moment: which day it is for them, which day an instant
// belongs to and between which UTC instants their days fall. It reads neither the clock nor the database.
public sealed class UserCalendar
{
    private readonly TimeZoneInfo _timeZone;

    public UserCalendar(TimeZoneInfo timeZone, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(timeZone, nameof(timeZone));

        _timeZone = timeZone;
        // "Now" is captured once, so today and the ranges built from it agree even across midnight.
        Today = GetLocalDay(now.UtcDateTime);
    }

    public DateOnly Today { get; }

    public DateOnly GetLocalDay(DateTime utcInstant) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcInstant, _timeZone));

    // UTC bounds of a range of local days: start of the first day (inclusive) and start of the day after the last one (exclusive).
    public (DateTime StartUtc, DateTime EndUtc) GetUtcRange(DateOnly firstDay, DateOnly lastDay)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(lastDay, firstDay, nameof(lastDay));

        // Calendar days are added to the date, never 24 hours to the instant: days can last 23 or 25 hours.
        return (GetStartOfDayUtc(firstDay), GetStartOfDayUtc(lastDay.AddDays(1)));
    }

    // The first UTC instant whose local day is the given one.
    private DateTime GetStartOfDayUtc(DateOnly day)
    {
        var midnight = day.ToDateTime(TimeOnly.MinValue);

        // Clocks jump over midnight (ConvertTimeToUtc would throw): the day starts at the instant of the jump.
        if (_timeZone.IsInvalidTime(midnight)) return FindJumpIntoDay(day);

        // Midnight happens twice: the day starts at the first one, the one with the larger offset.
        if (_timeZone.IsAmbiguousTime(midnight))
        {
            return DateTime.SpecifyKind(midnight - _timeZone.GetAmbiguousTimeOffsets(midnight).Max(), DateTimeKind.Utc);
        }

        return TimeZoneInfo.ConvertTimeToUtc(midnight, _timeZone);
    }

    // Narrows down, between noon of the previous day and noon of the given one, the instant where the local date changes.
    private DateTime FindJumpIntoDay(DateOnly day)
    {
        var before = TimeZoneInfo.ConvertTimeToUtc(day.AddDays(-1).ToDateTime(new TimeOnly(12, 0)), _timeZone);
        var after = TimeZoneInfo.ConvertTimeToUtc(day.ToDateTime(new TimeOnly(12, 0)), _timeZone);

        while (after.Ticks - before.Ticks > 1)
        {
            var middle = new DateTime(before.Ticks + (after.Ticks - before.Ticks) / 2, DateTimeKind.Utc);

            if (GetLocalDay(middle) < day) before = middle;
            else after = middle;
        }

        return after;
    }
}
