using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoraHealth.Infrastructure.EntityFramework.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "time_zone_id",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "Europe/Madrid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "time_zone_id",
                table: "users");
        }
    }
}
