using KoraHealth.Application.Mappers;
using KoraHealth.Application.Services.WaterTracking;
using KoraHealth.Domain.Contracts.Services.WaterTracking;

namespace KoraHealth.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => { }, typeof(AutoMapperProfile).Assembly);
        services.AddScoped<IWaterTrackingService, WaterTrackingService>();

        return services;
    }
}
