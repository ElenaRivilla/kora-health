using KoraHealth.Application;
using KoraHealth.Application.Authentication;
using KoraHealth.Domain.Models;
using KoraHealth.Infrastructure;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);


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
        db.Users.Add(new User { Id = FixedTestUser.Id, Username = FixedTestUser.Username });
        await db.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
