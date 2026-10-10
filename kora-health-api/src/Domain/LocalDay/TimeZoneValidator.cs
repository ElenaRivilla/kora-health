using System.Diagnostics.CodeAnalysis;

namespace KoraHealth.Domain.LocalDay;

public static class TimeZoneValidator
{
    // Identifiers of the system's time zones, to recover the right spelling whatever the case received.
    private static readonly Lazy<Dictionary<string, string>> SystemTimeZoneIds = new(() =>
        TimeZoneInfo.GetSystemTimeZones()
            .Select(timeZone => timeZone.Id)
            .DistinctBy(id => id, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(id => id, StringComparer.OrdinalIgnoreCase));

    // Gives the identifier to store for a time zone, or false when the value is not a valid IANA one.
    public static bool TryNormalize(string? value, [NotNullWhen(true)] out string? timeZoneId)
    {
        timeZoneId = null;

        if (string.IsNullOrEmpty(value)) return false;

        // The spelling is settled before asking the system for the zone: a lookup keeps the spelling
        // it was first asked with and hands it back to every later request for the same zone.
        if (!SystemTimeZoneIds.Value.TryGetValue(value, out var candidate))
        {
            // Aliases (Europe/Kiev, US/Pacific, Etc/UTC) are not listed; they are accepted only when spelled exactly.
            if (!TimeZoneInfo.TryConvertIanaIdToWindowsId(value, out _)) return false;

            candidate = value;
        }

        if (!TimeZoneInfo.TryFindSystemTimeZoneById(candidate, out var timeZone)) return false;

        // The system also resolves Windows identifiers such as "Romance Standard Time".
        if (!timeZone.HasIanaId) return false;

        timeZoneId = candidate;
        return true;
    }
}
