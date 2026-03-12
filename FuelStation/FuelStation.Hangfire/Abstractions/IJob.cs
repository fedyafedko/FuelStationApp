namespace FuelStation.Hangfire.Abstractions;

public interface IJob
{
    static abstract string Id { get; }
    Task Run(CancellationToken cancellationToken = default);
}

public interface IJob<in T>
    where T : IJobArgs
{
    static abstract string Id { get; }
    Task Run(T data, CancellationToken cancellationToken = default);
}