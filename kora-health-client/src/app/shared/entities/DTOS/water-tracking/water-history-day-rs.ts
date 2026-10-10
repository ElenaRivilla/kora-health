export interface WaterHistoryDayRs {
  /** Calendar date as sent by the API (`YYYY-MM-DD`). */
  date: string;
  totalMl: number;
  goalMl?: number | null;
}
