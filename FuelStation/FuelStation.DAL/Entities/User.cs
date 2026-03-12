using Microsoft.AspNetCore.Identity;

namespace FuelStation.DAL.Entities;

public class User : IdentityUser<Guid>
{
    public string Name { get; set; }
    public string? RefreshToken { get; set; }
    public DateTimeOffset RefreshTokenExpiresAt { get; set; }
    public List<Car> Cars { get; set; }
}