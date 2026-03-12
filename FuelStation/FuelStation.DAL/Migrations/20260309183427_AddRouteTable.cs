using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelStation.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Route",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FuelRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartLat = table.Column<double>(type: "float", nullable: false),
                    StartLng = table.Column<double>(type: "float", nullable: false),
                    EndLat = table.Column<double>(type: "float", nullable: false),
                    EndLng = table.Column<double>(type: "float", nullable: false),
                    Distance = table.Column<double>(type: "float", nullable: false),
                    Duration = table.Column<double>(type: "float", nullable: false),
                    Geometry = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Route", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Route_FuelRequest_FuelRequestId",
                        column: x => x.FuelRequestId,
                        principalTable: "FuelRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Route_FuelRequestId",
                table: "Route",
                column: "FuelRequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Route");
        }
    }
}
