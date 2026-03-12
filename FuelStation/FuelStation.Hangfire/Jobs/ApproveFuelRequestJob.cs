using FuelStation.BLL.Services.Interfaces;
using FuelStation.Hangfire.Abstractions;

namespace FuelStation.Hangfire.Jobs;

public class ApproveFuelRequestJob : IJob
{
    private readonly IProcessFuelRequestService _processFuelRequestService;

    public ApproveFuelRequestJob(IProcessFuelRequestService processFuelRequestService)
    {
        _processFuelRequestService = processFuelRequestService;
    }

    public static string Id => nameof(ApproveFuelRequestJob);

    public async Task Run(CancellationToken cancellationToken = default) =>
        await _processFuelRequestService.AssignRobotToRequest();
}
