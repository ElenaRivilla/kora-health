namespace KoraHealth.Domain.Entities.DTOs
{
    public class WaterHistoryDay
    {
        public DateOnly Date { get; set; }
        public int TotalMl { get; set; }
        public int? GoalMl { get; set; }
    }
}