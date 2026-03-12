namespace FuelStation.Hangfire.Abstractions;

public interface IHangfireService
{
    bool Delete(string jobId);

    string Enqueue<T>(CancellationToken cancellationToken = default)
        where T : IJob;

    string Enqueue<T, TA>(TA args, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs;

    string Schedule<T>(TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob;

    string Schedule<T, TA>(TA args, TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs;

    void SetupRecurring<T>(string id, string cron, CancellationToken cancellationToken = default)
        where T : IJob;

    void SetupRecurring<T, TA>(string id, TA args, string cron, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs;
}
