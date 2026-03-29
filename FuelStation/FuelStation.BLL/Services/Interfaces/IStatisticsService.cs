using FuelStation.Common.Models.Statistics;

namespace FuelStation.BLL.Services.Interfaces;

public interface IStatisticsService
{
    Task<StatisticsResponse> Statistics();
}
