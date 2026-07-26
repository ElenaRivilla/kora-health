namespace KoraHealth.Application.DTOs.Response
{
    public class WaterHistoryDayRs
    {
        public DateOnly Date { get; set; }
        public int TotalMl { get; set; }
        public int? GoalMl { get; set; }
    }
}
