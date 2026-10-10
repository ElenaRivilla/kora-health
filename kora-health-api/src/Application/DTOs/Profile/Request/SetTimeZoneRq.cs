namespace KoraHealth.Application.DTOs.Profile.Request;

public class SetTimeZoneRq : BaseApiRq
{
    private const int MaxLength = 64;

    public string? TimeZoneId { get; set; }
    
    public override bool IsValid() =>
        !string.IsNullOrEmpty(TimeZoneId)
        && TimeZoneId.Length <= MaxLength
        && TimeZoneId == TimeZoneId.Trim();
}
