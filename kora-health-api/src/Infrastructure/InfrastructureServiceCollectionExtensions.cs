using KoraHealth.Domain.Contracts.Repositories;
using KoraHealth.Infrastructure.EntityFramework;
using KoraHealth.Infrastructure.Repositories.BBDD;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KoraHealth.Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<KoraHealthDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IWaterTrackingRepository, WaterTrackingRepository>();

        return services;
    }
}
