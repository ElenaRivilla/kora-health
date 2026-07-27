namespace KoraHealth.Domain.Entities.WaterTracking;

public class WaterGoalEntity : BaseEntity
{
    public int UserId { get; set; }
    public int DailyGoalMl { get; set; }
    public DateTime DateUpdated { get; set; }
}
