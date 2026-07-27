namespace KoraHealth.Application.DTOs.WaterTracking.Response
{
    public class WaterHistoryDayRs
    {
        public DateOnly Date { get; set; }
        public int TotalMl { get; set; }
        public int? GoalMl { get; set; }
    }
}
