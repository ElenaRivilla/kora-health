using KoraHealth.Application;
using KoraHealth.Application.Authentication;
using KoraHealth.Domain.Entities.User;
using KoraHealth.Infrastructure;
using KoraHealth.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KoraHealthDbContext>();
    await db.Database.MigrateAsync();

    // Seed the database with a fixed test user if it doesn't exist
    if (!await db.Users.AnyAsync(u => u.Id == FixedTestUser.Id))
    {
        db.Users.Add(new UserEntity { Id = FixedTestUser.Id, Username = FixedTestUser.Username });
        await db.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
