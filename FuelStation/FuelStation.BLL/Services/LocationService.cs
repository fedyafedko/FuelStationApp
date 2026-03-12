using AutoMapper;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Models.DTOs.Location;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Runtime.InteropServices;

namespace FuelStation.BLL.Services;

public class LocationService : ILocationService
{
    private readonly IRepository<Location> _locationRepository;
    private readonly IMapper _mapper;

    public LocationService(
        IRepository<Location> locationRepository,
        IMapper mapper)
    {
        _locationRepository = locationRepository;
        _mapper = mapper;
    }

    public async Task<Guid> GetOrCreateLocationIdAsync(CreateLocationDTO dto)
    {
        var location = await _locationRepository
            .Query()
            .FirstOrDefaultAsync(x => x.Latitude == x.Latitude && x.Longitude == x.Longitude);

        if (location == null)
        {
            location = _mapper.Map<Location>(dto);

            var result = await _locationRepository.InsertAsync(location);

            if (!result)
            {
                throw new ExternalException("Can not create location");
            }
        }

        return location.Id;
    }
}