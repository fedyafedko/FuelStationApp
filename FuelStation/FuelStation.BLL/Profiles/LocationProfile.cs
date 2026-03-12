using AutoMapper;
using FuelStation.Common.Models.DTOs.Location;
using FuelStation.DAL.Entities;

namespace FuelStation.BLL.Profiles;

public class LocationProfile : Profile
{
    public LocationProfile()
    {
        CreateMap<Location, LocationDTO>();
        CreateMap<CreateLocationDTO, Location>();
    }
}