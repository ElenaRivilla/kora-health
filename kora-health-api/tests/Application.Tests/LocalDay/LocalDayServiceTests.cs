using KoraHealth.Application.Services.LocalDay;
using KoraHealth.Application.Tests.TestDoubles;
using Microsoft.Extensions.Logging;

namespace KoraHealth.Application.Tests.LocalDay;

public class LocalDayServiceTests
{
    private const int UserId = 1;
    private static readonly DateTimeOffset JustAfterMadridMidnight = new(2026, 10, 10, 22, 30, 0, TimeSpan.Zero);

    [Fact]
    public async Task GetCalendarAsync_UsesTheUsersTimeZoneAndTheClock()
    {
        var logger = new RecordingLogger<LocalDayService>();
        var service = new LocalDayService(new InMemoryProfileRepository("Europe/Madrid"), new FixedTimeProvider(JustAfterMadridMidnight), logger);

        var calendar = await service.GetCalendarAsync(UserId);

        Assert.Equal(new DateOnly(2026, 10, 11), calendar.Today);
        Assert.Empty(logger.Entries);
    }

    [Fact]
    public async Task GetCalendarAsync_AnotherTimeZone_GivesAnotherDayForTheSameInstant()
    {
        var service = new LocalDayService(new InMemoryProfileRepository("UTC"), new FixedTimeProvider(JustAfterMadridMidnight), new RecordingLogger<LocalDayService>());

        var calendar = await service.GetCalendarAsync(UserId);

        Assert.Equal(new DateOnly(2026, 10, 10), calendar.Today);
    }

    [Fact]
    public async Task GetCalendarAsync_ReadsTheTimeZoneOnEveryCall()
    {
        var repository = new InMemoryProfileRepository("UTC");
        var service = new LocalDayService(repository, new FixedTimeProvider(JustAfterMadridMidnight), new RecordingLogger<LocalDayService>());

        var before = await service.GetCalendarAsync(UserId);
        repository.TimeZoneId = "Europe/Madrid";
        var after = await service.GetCalendarAsync(UserId);

        Assert.Equal(new DateOnly(2026, 10, 10), before.Today);
        Assert.Equal(new DateOnly(2026, 10, 11), after.Today);
    }

    [Fact]
    public async Task GetCalendarAsync_StoredTimeZoneThatCannotBeResolved_FallsBackToTheDefaultAndWarns()
    {
        var logger = new RecordingLogger<LocalDayService>();
        var service = new LocalDayService(new InMemoryProfileRepository("Foo/Bar"), new FixedTimeProvider(JustAfterMadridMidnight), logger);

        var calendar = await service.GetCalendarAsync(UserId);

        // Same answers as with Europe/Madrid.
        Assert.Equal(new DateOnly(2026, 10, 11), calendar.Today);
        Assert.Equal(new DateOnly(2026, 10, 10), calendar.GetLocalDay(new DateTime(2026, 10, 10, 21, 59, 59, DateTimeKind.Utc)));

        var entry = Assert.Single(logger.Entries);
        Assert.Equal(LogLevel.Warning, entry.Level);
        Assert.Contains("Foo/Bar", entry.Message);
        Assert.Contains(UserId.ToString(), entry.Message);
    }
}
