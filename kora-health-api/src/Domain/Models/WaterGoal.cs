namespace KoraHealth.Domain.Models;

public class WaterGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int DailyGoalMl { get; set; }
    public DateTime DateUpdated { get; set; }
}
