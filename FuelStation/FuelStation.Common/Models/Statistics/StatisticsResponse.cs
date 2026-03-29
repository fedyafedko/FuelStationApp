using FuelStation.Common.Models.DTOs.FuelRequest;

namespace FuelStation.Common.Models.Statistics;

public class StatisticsResponse
{
    public int TotalRequests { get; set; }
    public int ActiveRequests { get; set; }
    public int CompletedRequests {  get; set; }
    public int TotalRevenue { get; set; }
    public List<FuelRequestDTO> RecentRequests { get; set; }
}
