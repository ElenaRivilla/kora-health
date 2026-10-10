using AutoMapper;
using KoraHealth.Application.DTOs.Profile.Request;
using KoraHealth.Application.DTOs.Profile.Response;
using KoraHealth.Application.DTOs.WaterTracking.Request;
using KoraHealth.Application.DTOs.WaterTracking.Response;
using KoraHealth.Domain.Entities.WaterTracking;
using KoraHealth.Domain.Models.Profile;
using KoraHealth.Domain.Models.WaterTracking;

namespace KoraHealth.Application.Mappers;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<SetWaterGoalRq, WaterGoal>();
        CreateMap<LogWaterRq, WaterEntry>();
        CreateMap<SetTimeZoneRq, UserTimeZone>();

        CreateMap<WaterGoal, WaterGoalRs>();
        CreateMap<WaterEntry, WaterEntryRs>();
        CreateMap<WaterHistoryDay, WaterHistoryDayRs>();
        CreateMap<UserTimeZone, TimeZoneRs>();

        CreateMap<WaterGoalEntity, WaterGoal>();
        CreateMap<WaterEntryEntity, WaterEntry>();
    }
}
