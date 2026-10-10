using KoraHealth.Domain.LocalDay;

namespace KoraHealth.Domain.Entities.User;

public class UserEntity : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string TimeZoneId { get; set; } = TimeZoneDefaults.DefaultTimeZoneId;
}
