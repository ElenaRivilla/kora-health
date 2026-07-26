namespace KoraHealth.Domain.Models;

public class WaterEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int AmountMl { get; set; }
    public DateTime LoggedAtUtc { get; set; }
}
