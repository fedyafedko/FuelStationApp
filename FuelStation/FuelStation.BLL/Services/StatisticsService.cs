using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Enums;
using FuelStation.Common.Models.DTOs.FuelRequest;
using FuelStation.Common.Models.Statistics;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FuelStation.BLL.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IRepository<FuelRequest> _fuelRequestRepository;
    private readonly IMapper _mapper;

    public StatisticsService(
        IRepository<FuelRequest> fuelRequestRepository,
        IMapper mapper)
    {
        _fuelRequestRepository = fuelRequestRepository;
        _mapper = mapper;
    }

    public async Task<StatisticsResponse> Statistics()
    {
        var totalRequests = await _fuelRequestRepository.CountAsync();

        var activeRequests = await _fuelRequestRepository
            .Where(x => x.Status == RequestStatus.InProgress
                || x.Status == RequestStatus.Pending
                || x.Status == RequestStatus.WaitingForPayment
                || x.Status == RequestStatus.StartFueling)
            .CountAsync();

        var completedRequests = await _fuelRequestRepository
            .Where(x => x.Status == RequestStatus.Completed)
            .CountAsync();

        var totalRevenue = await _fuelRequestRepository
            .Where(x => x.Status == RequestStatus.Completed)
            .SumAsync(x => (decimal?)x.TotalPrice) ?? 0;

        var recentRequestsEntity = await _fuelRequestRepository
            .OrderByDescending(x => x.CreateAt)   
            .Take(5)
            .ToListAsync();

        var recentRequests = _mapper.Map<List<FuelRequestDTO>>(recentRequestsEntity);

        var result = new StatisticsResponse
        {
            TotalRequests = totalRequests,
            ActiveRequests = activeRequests,
            CompletedRequests = completedRequests,
            TotalRevenue = (int)totalRevenue,
            RecentRequests = recentRequests
        };

        return result;
    }
}