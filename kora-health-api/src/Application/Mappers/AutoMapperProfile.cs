using AutoMapper;
using KoraHealth.Application.DTOs.Request;
using KoraHealth.Application.DTOs.Response;
using KoraHealth.Domain.Entities.DTOs;

namespace KoraHealth.Application.Mappers;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<SetWaterGoalRq, WaterGoal>();
        CreateMap<LogWaterRq, WaterEntry>();

        CreateMap<WaterGoal, WaterGoalRs>()
            .ForMember(x => x.UpdatedAt, y => y.MapFrom(src => src.UpdatedAtUtc));
        CreateMap<WaterEntry, WaterEntryRs>();
        CreateMap<WaterHistoryDay, WaterHistoryDayRs>();
    }
}
