using Microsoft.AspNetCore.Identity;
using FuelStation.Seeding.Interfaces;

namespace FuelStation.Seeding.Behaviours;

public class RoleSeedingBehaviour : ISeedingBehaviour
{
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public RoleSeedingBehaviour(RoleManager<IdentityRole<Guid>> roleManager)
    {
        _roleManager = roleManager;
    }

    public async Task SeedAsync()
    {
        var roles = new List<string>
        {
            "Dispatcher",
            "Driver"
        };

        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }
    }
}