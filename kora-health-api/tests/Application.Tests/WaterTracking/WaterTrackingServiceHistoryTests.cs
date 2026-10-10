using AutoMapper;
using KoraHealth.Application.Mappers;
using KoraHealth.Application.Services.LocalDay;
using KoraHealth.Application.Services.WaterTracking;
using KoraHealth.Application.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace KoraHealth.Application.Tests.WaterTracking;

public class WaterTrackingServiceHistoryTests
{
    private const int UserId = 1;

    // 2026-10-11 12:00 in Europe/Madrid (UTC+2).
    private static readonly DateTimeOffset Now = new(2026, 10, 11, 10, 0, 0, TimeSpan.Zero);

    // Madrid's midnight between 10 and 11 October 2026 is 22:00 UTC.
    private static readonly DateTime EveningBeforeMadridMidnight = new(2026, 10, 10, 19, 50, 0, DateTimeKind.Utc);
    private static readonly DateTime LastMinuteBeforeMadridMidnight = new(2026, 10, 10, 21, 59, 0, DateTimeKind.Utc);
    private static readonly DateTime JustAfterMadridMidnight = new(2026, 10, 10, 22, 2, 0, DateTimeKind.Utc);

    private static readonly DateOnly October10 = new(2026, 10, 10);
    private static readonly DateOnly October11 = new(2026, 10, 11);

    private static readonly IMapper Mapper =
        new MapperConfiguration(cfg => cfg.AddProfile<AutoMapperProfile>(), NullLoggerFactory.Instance).CreateMapper();

    private static WaterTrackingService CreateService(InMemoryWaterTrackingRepository waterRepository, InMemoryProfileRepository profileRepository)
    {
        var localDayService = new LocalDayService(profileRepository, new FixedTimeProvider(Now), new RecordingLogger<LocalDayService>());

        return new WaterTrackingService(waterRepository, localDayService, Mapper);
    }

    [Fact]
    public async Task GetHistoryAsync_EntriesAroundLocalMidnight_FallOnTwoLocalDays()
    {
        var waterRepository = new InMemoryWaterTrackingRepository();
        waterRepository.AddEntryAt(EveningBeforeMadridMidnight, 250);
        waterRepository.AddEntryAt(JustAfterMadridMidnight, 500);
        await waterRepository.SetGoalAsync(UserId, 2750);
        var service = CreateService(waterRepository, new InMemoryProfileRepository("Europe/Madrid"));

        var history = await service.GetHistoryAsync(UserId, 30);

        // Most recent day first, although both entries share the UTC day 2026-10-10.
        Assert.Equal([October11, October10], history.Select(d => d.Date));
        Assert.Equal([500, 250], history.Select(d => d.TotalMl));
        Assert.Equal(750, history.Sum(d => d.TotalMl));
        Assert.All(history, d => Assert.Equal(2750, d.GoalMl));
    }

    [Fact]
    public async Task GetHistoryAsync_WindowOfOneDay_OnlyHasTheCurrentLocalDay()
    {
        var waterRepository = new InMemoryWaterTrackingRepository();
        waterRepository.AddEntryAt(LastMinuteBeforeMadridMidnight, 100);
        waterRepository.AddEntryAt(JustAfterMadridMidnight, 500);
        var service = CreateService(waterRepository, new InMemoryProfileRepository("Europe/Madrid"));

        var history = await service.GetHistoryAsync(UserId, 1);

        var day = Assert.Single(history);
        Assert.Equal(October11, day.Date);
        Assert.Equal(500, day.TotalMl);
        Assert.Null(day.GoalMl);
    }

    [Fact]
    public async Task GetHistoryAsync_WindowOfTwoDays_HasBothLocalDays()
    {
        var waterRepository = new InMemoryWaterTrackingRepository();
        waterRepository.AddEntryAt(LastMinuteBeforeMadridMidnight, 100);
        waterRepository.AddEntryAt(JustAfterMadridMidnight, 500);
        var service = CreateService(waterRepository, new InMemoryProfileRepository("Europe/Madrid"));

        var history = await service.GetHistoryAsync(UserId, 2);

        Assert.Equal([October11, October10], history.Select(d => d.Date));
        Assert.Equal([500, 100], history.Select(d => d.TotalMl));
    }

    [Fact]
    public async Task GetHistoryAsync_AfterChangingTheTimeZone_RegroupsTheSameEntries()
    {
        var waterRepository = new InMemoryWaterTrackingRepository();
        waterRepository.AddEntryAt(EveningBeforeMadridMidnight, 250);
        waterRepository.AddEntryAt(JustAfterMadridMidnight, 500);
        var profileRepository = new InMemoryProfileRepository("Europe/Madrid");
        var service = CreateService(waterRepository, profileRepository);

        var inMadrid = await service.GetHistoryAsync(UserId, 30);
        profileRepository.TimeZoneId = "UTC";
        var inUtc = await service.GetHistoryAsync(UserId, 30);
        // UTC+14: both entries were logged on the morning of the 11th there.
        profileRepository.TimeZoneId = "Pacific/Kiritimati";
        var inKiritimati = await service.GetHistoryAsync(UserId, 30);
        // UTC-7: both entries were logged on the afternoon of the 10th there.
        profileRepository.TimeZoneId = "America/Los_Angeles";
        var inLosAngeles = await service.GetHistoryAsync(UserId, 30);

        Assert.Equal([October11, October10], inMadrid.Select(d => d.Date));
        Assert.Equal(October10, Assert.Single(inUtc).Date);
        Assert.Equal(October11, Assert.Single(inKiritimati).Date);
        Assert.Equal(October10, Assert.Single(inLosAngeles).Date);

        // The entries are the same ones: only the day each one falls on changes.
        Assert.All(new[] { inMadrid, inUtc, inKiritimati, inLosAngeles }, history => Assert.Equal(750, history.Sum(d => d.TotalMl)));
    }

    [Fact]
    public async Task GetHistoryAsync_AsksTheRepositoryFromTheUtcStartOfTheFirstLocalDay()
    {
        var waterRepository = new InMemoryWaterTrackingRepository();
        var service = CreateService(waterRepository, new InMemoryProfileRepository("Europe/Madrid"));

        await service.GetHistoryAsync(UserId, 3);

        // Three local days ending on 11 October start at Madrid's midnight of the 9th, which is 22:00 UTC of the 8th.
        Assert.Equal(new DateTime(2026, 10, 8, 22, 0, 0), waterRepository.LastSinceUtc);
        Assert.Equal(DateTimeKind.Utc, waterRepository.LastSinceUtc!.Value.Kind);
    }

    [Fact]
    public async Task GetHistoryAsync_EntriesBeforeTheWindow_AreDroppedEvenIfTheRepositoryReturnsThem()
    {
        var waterRepository = new InMemoryWaterTrackingRepository { IgnoreLowerBound = true };
        waterRepository.AddEntryAt(LastMinuteBeforeMadridMidnight, 100);
        waterRepository.AddEntryAt(JustAfterMadridMidnight, 500);
        var service = CreateService(waterRepository, new InMemoryProfileRepository("Europe/Madrid"));

        var history = await service.GetHistoryAsync(UserId, 1);

        var day = Assert.Single(history);
        Assert.Equal(October11, day.Date);
        Assert.Equal(500, day.TotalMl);
    }
}
