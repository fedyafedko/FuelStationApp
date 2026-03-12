using FuelStation.Common.Models.Configs.Base;

namespace FuelStation.Common.Models.Configs;

public class JwtConfig : ConfigBase
{
    public string Secret { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public string Issuer { get; set; } = string.Empty;

    public TimeSpan AccessTokenLifetime { get; set; }

    public TimeSpan RefreshTokenLifetime { get; set; }

    public TimeSpan ClockSkew { get; set; }
}
