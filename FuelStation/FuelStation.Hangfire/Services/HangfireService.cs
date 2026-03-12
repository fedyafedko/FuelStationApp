using Hangfire;
using FuelStation.Hangfire.Abstractions;

namespace FuelStation.Hangfire.Services;

public class HangfireService : IHangfireService
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IRecurringJobManager _recurringJobManager;

    private static readonly RecurringJobOptions _recurringJobOptions = new()
    {
        TimeZone = TimeZoneInfo.Local
    };

    public HangfireService(
        IBackgroundJobClient backgroundJobClient,
        IRecurringJobManager recurringJobManager)
    {
        _backgroundJobClient = backgroundJobClient;
        _recurringJobManager = recurringJobManager;
    }

    public bool Delete(string jobId)
    {
        return _backgroundJobClient.Delete(jobId);
    }

    public string Enqueue<T>(CancellationToken cancellationToken = default)
        where T : IJob
    {
        return _backgroundJobClient.Enqueue<T>(j => j.Run(cancellationToken));
    }

    public string Enqueue<T, TA>(TA args, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        return _backgroundJobClient.Enqueue<T>(j => j.Run(args, cancellationToken));
    }

    public string Schedule<T>(TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob
    {
        return _backgroundJobClient.Schedule<T>(j => j.Run(cancellationToken), delay);
    }

    public string Schedule<T, TA>(TA args, TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        return _backgroundJobClient.Schedule<T>(j => j.Run(args, cancellationToken), delay);
    }

    public void SetupRecurring<T>(string id, string cron, CancellationToken cancellationToken = default)
        where T : IJob
    {
        _recurringJobManager.AddOrUpdate<T>(
            id,
            j => j.Run(cancellationToken),
            cron,
            _recurringJobOptions);
    }

    public void SetupRecurring<T, TA>(string id, TA args, string cron, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        _recurringJobManager.AddOrUpdate<T>(
            id,
            j => j.Run(args, cancellationToken),
            cron,
            _recurringJobOptions);
    }
}