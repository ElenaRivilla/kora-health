using KoraHealth.Domain.LocalDay;

namespace KoraHealth.Application.Tests.LocalDay;

// Expected instants come from the time zone rules of 2026 and rely on the system's time zone database.
public class UserCalendarTests
{
    private static readonly TimeZoneInfo Madrid = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
    private static readonly TimeZoneInfo Havana = TimeZoneInfo.FindSystemTimeZoneById("America/Havana");
    private static readonly DateTimeOffset AnyNow = new(2026, 6, 15, 12, 0, 0, TimeSpan.Zero);

    private static DateTime Utc(int year, int month, int day, int hour = 0, int minute = 0, int second = 0) =>
        new(year, month, day, hour, minute, second, DateTimeKind.Utc);

    [Theory]
    [InlineData(19, 50, 0, 10)]
    [InlineData(21, 59, 59, 10)]
    [InlineData(22, 0, 0, 11)]
    [InlineData(22, 5, 0, 11)]
    public void GetLocalDay_AroundMadridMidnight_ReturnsTheLocalDay(int hour, int minute, int second, int expectedDay)
    {
        var calendar = new UserCalendar(Madrid, AnyNow);

        var day = calendar.GetLocalDay(Utc(2026, 10, 10, hour, minute, second));

        Assert.Equal(new DateOnly(2026, 10, expectedDay), day);
    }

    [Fact]
    public void Today_AfterLocalMidnight_IsTheNewLocalDay()
    {
        var calendar = new UserCalendar(Madrid, new DateTimeOffset(2026, 10, 10, 22, 30, 0, TimeSpan.Zero));

        Assert.Equal(new DateOnly(2026, 10, 11), calendar.Today);
    }

    [Fact]
    public void Today_IsCapturedFromAnOffsetInstant()
    {
        // The same instant as 2026-10-10T22:30Z, written with another offset.
        var calendar = new UserCalendar(Madrid, new DateTimeOffset(2026, 10, 10, 17, 30, 0, TimeSpan.FromHours(-5)));

        Assert.Equal(new DateOnly(2026, 10, 11), calendar.Today);
    }

    [Fact]
    public void GetUtcRange_DayWhenClocksGoBack_Lasts25Hours()
    {
        var calendar = new UserCalendar(Madrid, AnyNow);

        var (startUtc, endUtc) = calendar.GetUtcRange(new DateOnly(2026, 10, 25), new DateOnly(2026, 10, 25));

        Assert.Equal(Utc(2026, 10, 24, 22), startUtc);
        Assert.Equal(Utc(2026, 10, 25, 23), endUtc);
        Assert.Equal(TimeSpan.FromHours(25), endUtc - startUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void GetUtcRange_DayWhenClocksGoForward_Lasts23Hours()
    {
        var calendar = new UserCalendar(Madrid, AnyNow);

        var (startUtc, endUtc) = calendar.GetUtcRange(new DateOnly(2026, 3, 29), new DateOnly(2026, 3, 29));

        Assert.Equal(Utc(2026, 3, 28, 23), startUtc);
        Assert.Equal(Utc(2026, 3, 29, 22), endUtc);
        Assert.Equal(TimeSpan.FromHours(23), endUtc - startUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void GetUtcRange_SeveralDaysAcrossAClockChange_IsNotAMultipleOf24Hours()
    {
        var calendar = new UserCalendar(Madrid, AnyNow);

        var (startUtc, endUtc) = calendar.GetUtcRange(new DateOnly(2026, 10, 24), new DateOnly(2026, 10, 26));

        Assert.Equal(Utc(2026, 10, 23, 22), startUtc);
        Assert.Equal(Utc(2026, 10, 26, 23), endUtc);
        Assert.Equal(TimeSpan.FromHours(73), endUtc - startUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void GetUtcRange_Bounds_MatchTheDaysOfTheInstantsAroundThem()
    {
        var calendar = new UserCalendar(Madrid, AnyNow);
        var firstDay = new DateOnly(2026, 10, 24);
        var lastDay = new DateOnly(2026, 10, 26);

        var (startUtc, endUtc) = calendar.GetUtcRange(firstDay, lastDay);

        Assert.Equal(firstDay.AddDays(-1), calendar.GetLocalDay(startUtc.AddTicks(-1)));
        Assert.Equal(firstDay, calendar.GetLocalDay(startUtc));
        Assert.Equal(lastDay, calendar.GetLocalDay(endUtc.AddTicks(-1)));
        Assert.Equal(lastDay.AddDays(1), calendar.GetLocalDay(endUtc));
    }

    [Fact]
    public void GetUtcRange_MidnightThatDoesNotExist_StartsAtTheClockJump()
    {
        // In Havana clocks jump from 00:00 to 01:00 on 2026-03-08: that midnight never happens.
        var calendar = new UserCalendar(Havana, AnyNow);
        var day = new DateOnly(2026, 3, 8);

        var (startUtc, endUtc) = calendar.GetUtcRange(day, day);

        Assert.Equal(Utc(2026, 3, 8, 5), startUtc);
        Assert.Equal(day, calendar.GetLocalDay(startUtc));
        Assert.Equal(day.AddDays(-1), calendar.GetLocalDay(startUtc.AddSeconds(-1)));
        Assert.Equal(TimeSpan.FromHours(23), endUtc - startUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void GetUtcRange_MidnightThatHappensTwice_StartsAtTheFirstOne()
    {
        // In Havana clocks go back from 01:00 to 00:00 on 2026-11-01: that midnight happens twice.
        var calendar = new UserCalendar(Havana, AnyNow);
        var day = new DateOnly(2026, 11, 1);

        var (startUtc, endUtc) = calendar.GetUtcRange(day, day);

        Assert.Equal(Utc(2026, 11, 1, 4), startUtc);
        Assert.Equal(day, calendar.GetLocalDay(startUtc));
        Assert.Equal(day.AddDays(-1), calendar.GetLocalDay(startUtc.AddSeconds(-1)));
        Assert.Equal(TimeSpan.FromHours(25), endUtc - startUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void Utc_DaysAreTheUtcDays()
    {
        var calendar = new UserCalendar(TimeZoneInfo.Utc, new DateTimeOffset(2026, 10, 10, 23, 59, 59, TimeSpan.Zero));
        var day = new DateOnly(2026, 10, 10);

        var (startUtc, endUtc) = calendar.GetUtcRange(day, day);

        Assert.Equal(day, calendar.Today);
        Assert.Equal(day, calendar.GetLocalDay(Utc(2026, 10, 10, 23, 59, 59)));
        Assert.Equal(Utc(2026, 10, 10), startUtc);
        Assert.Equal(Utc(2026, 10, 11), endUtc);
        AssertUtc(startUtc, endUtc);
    }

    [Fact]
    public void GetUtcRange_LastDayBeforeFirstDay_Throws()
    {
        var calendar = new UserCalendar(Madrid, AnyNow);

        Assert.Throws<ArgumentOutOfRangeException>(() => calendar.GetUtcRange(new DateOnly(2026, 10, 11), new DateOnly(2026, 10, 10)));
    }

    private static void AssertUtc(params DateTime[] instants) =>
        Assert.All(instants, instant => Assert.Equal(DateTimeKind.Utc, instant.Kind));
}
