namespace KoraHealth.Domain.Entities.WaterTracking;

public class WaterEntryEntity : BaseEntity
{
    public int UserId { get; set; }
    public int AmountMl { get; set; }
    public DateTime DateCreated { get; set; }
}
