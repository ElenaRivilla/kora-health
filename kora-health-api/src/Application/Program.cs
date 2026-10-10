using KoraHealth.Application;
using KoraHealth.Application.Authentication;
using KoraHealth.Domain.Entities.User;
using KoraHealth.Domain.LocalDay;
using KoraHealth.Infrastructure;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

const string CorsPolicyName = "AllowedOrigins";

var builder = WebApplication.CreateBuilder(args);

// Origins allowed to call the API come from configuration; none are open by default.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy => policy
        .WithOrigins(allowedOrigins)
        .WithMethods("GET", "PUT", "POST")
        .WithHeaders("Content-Type"));
});

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Kora Health API",
        Version = "v1"
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KoraHealthDbContext>();
    await db.Database.MigrateAsync();

    // Seed the database with a fixed test user if it doesn't exist
    if (!await db.Users.AnyAsync(u => u.Id == FixedTestUser.Id))
    {
        db.Users.Add(new UserEntity
        {
            Id = FixedTestUser.Id,
            Username = FixedTestUser.Username,
            TimeZoneId = TimeZoneDefaults.DefaultTimeZoneId
        });
        await db.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(CorsPolicyName);

app.UseAuthorization();

app.MapControllers();

app.Run();
