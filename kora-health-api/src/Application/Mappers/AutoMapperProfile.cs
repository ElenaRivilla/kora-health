using AutoMapper;
using KoraHealth.Application.DTOs.WaterTracking.Request;
using KoraHealth.Application.DTOs.WaterTracking.Response;
using KoraHealth.Domain.Entities.WaterTracking;
using KoraHealth.Domain.Models.WaterTracking;

namespace KoraHealth.Application.Mappers;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<SetWaterGoalRq, WaterGoal>();
        CreateMap<LogWaterRq, WaterEntry>();

        CreateMap<WaterGoal, WaterGoalRs>();
        CreateMap<WaterEntry, WaterEntryRs>();
        CreateMap<WaterHistoryDay, WaterHistoryDayRs>();

        CreateMap<WaterGoalEntity, WaterGoal>();
        CreateMap<WaterEntryEntity, WaterEntry>();
    }
}
