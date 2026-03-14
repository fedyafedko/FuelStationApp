using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelStation.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueNumberToRobot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmationCode",
                table: "FuelRequest");

            migrationBuilder.AddColumn<string>(
                name: "UniqueNumber",
                table: "Robot",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UniqueNumber",
                table: "Robot");

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationCode",
                table: "FuelRequest",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
