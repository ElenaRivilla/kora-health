using KoraHealth.Domain.LocalDay;

namespace KoraHealth.Application.Tests.LocalDay;

// These cases rely on the system's time zone database (which zones and aliases it knows).
public class TimeZoneValidatorTests
{
    [Fact]
    public void TryNormalize_ZoneOfTheSystemList_IsValid()
    {
        Assert.True(TimeZoneValidator.TryNormalize("Europe/Madrid", out var timeZoneId));
        Assert.Equal("Europe/Madrid", timeZoneId);
    }

    [Theory]
    [InlineData("Europe/Kiev")]
    [InlineData("US/Pacific")]
    [InlineData("CET")]
    [InlineData("UTC")]
    [InlineData("Etc/UTC")]
    public void TryNormalize_AliasWithItsExactSpelling_IsValidAndKeptAsReceived(string alias)
    {
        Assert.True(TimeZoneValidator.TryNormalize(alias, out var timeZoneId));
        Assert.Equal(alias, timeZoneId);
    }

    [Theory]
    [InlineData("europe/madrid")]
    [InlineData("EUROPE/MADRID")]
    public void TryNormalize_ZoneOfTheSystemListInAnotherCase_IsStoredWithTheSpellingOfTheList(string value)
    {
        Assert.True(TimeZoneValidator.TryNormalize(value, out var timeZoneId));
        Assert.Equal("Europe/Madrid", timeZoneId);
    }

    [Theory]
    [InlineData("us/pacific")]
    [InlineData("Romance Standard Time")]
    [InlineData("Foo/Bar")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData(" Europe/Madrid")]
    [InlineData("Europe/Madrid ")]
    public void TryNormalize_NotAValidIanaIdentifier_IsRejected(string? value)
    {
        Assert.False(TimeZoneValidator.TryNormalize(value, out var timeZoneId));
        Assert.Null(timeZoneId);
    }

    // .NET remembers, for the whole process, the first spelling it is asked with for each zone. These two
    // tests use zones no other test of the project asks for, so the wrong spelling is the first one it sees.
    [Fact]
    public void TryNormalize_AfterAWronglyCasedZone_StillReturnsTheRightSpelling()
    {
        Assert.True(TimeZoneValidator.TryNormalize("pacific/auckland", out var fromWrongCase));
        Assert.True(TimeZoneValidator.TryNormalize("Pacific/Auckland", out var fromRightCase));

        Assert.Equal("Pacific/Auckland", fromWrongCase);
        Assert.Equal("Pacific/Auckland", fromRightCase);
    }

    [Fact]
    public void TryNormalize_AfterAWronglyCasedAlias_StillAcceptsTheRightSpelling()
    {
        Assert.False(TimeZoneValidator.TryNormalize("us/eastern", out _));

        Assert.True(TimeZoneValidator.TryNormalize("US/Eastern", out var timeZoneId));
        Assert.Equal("US/Eastern", timeZoneId);
    }
}
