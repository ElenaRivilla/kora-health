namespace KoraHealth.Application.DTOs.WaterTracking.Request;

public class SetWaterGoalRq : BaseApiRq
{
    public int DailyGoalMl { get; set; }

    public override bool IsValid() => DailyGoalMl > 0;
}
