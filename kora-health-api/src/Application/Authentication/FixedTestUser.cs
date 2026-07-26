namespace KoraHealth.Application.Authentication;

// Implements the `auth` capability's "Single Fixed Development User" requirement
// (openspec/specs/auth/spec.md). Remove entirely once real authentication exists.
public static class FixedTestUser
{
    public const int Id = 1;
    public const string Username = "dev-test-user";
}
