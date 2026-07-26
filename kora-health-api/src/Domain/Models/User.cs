namespace KoraHealth.Domain.Models;

// Placeholder identity until the `auth` capability replaces the fixed dev user (see openspec/specs/auth).
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
}
