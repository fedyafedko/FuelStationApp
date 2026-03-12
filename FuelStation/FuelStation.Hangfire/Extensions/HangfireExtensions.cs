using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FuelStation.Hangfire.Abstractions;
using FuelStation.Hangfire.Jobs;
using FuelStation.Common.Models.Configs;

namespace FuelStation.Hangfire.Extensions;

public static class HangfireExtensions
{
    public static void SetupHangfire(this IHost host, HangfireConfig config)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;

        var hangfireService = services.GetRequiredService<IHangfireService>();

        hangfireService.SetupRecurring<ApproveFuelRequestJob>(
            ApproveFuelRequestJob.Id,
            config.ApproveFuelRequestCron);
    }
}
