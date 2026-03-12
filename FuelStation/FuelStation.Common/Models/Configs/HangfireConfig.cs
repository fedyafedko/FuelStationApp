using FuelStation.Common.Models.Configs.Base;

namespace FuelStation.Common.Models.Configs;

public class HangfireConfig : ConfigBase
{
    public string ApproveFuelRequestCron { get; set; } = string.Empty;
}
