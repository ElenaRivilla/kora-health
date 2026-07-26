using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoraHealth.Infrastructure.EntityFramework.Migrations
{
    /// <inheritdoc />
    public partial class RenameWaterDateColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "updated_at_utc",
                table: "water_goals",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "logged_at_utc",
                table: "water_entries",
                newName: "date_created");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "water_goals",
                newName: "updated_at_utc");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "water_entries",
                newName: "logged_at_utc");
        }
    }
}
