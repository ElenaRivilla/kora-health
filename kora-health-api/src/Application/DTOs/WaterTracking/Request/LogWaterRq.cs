namespace KoraHealth.Application.DTOs.WaterTracking.Request;

public class LogWaterRq : BaseApiRq
{
    public int AmountMl { get; set; }

    public override bool IsValid() => AmountMl > 0;
}