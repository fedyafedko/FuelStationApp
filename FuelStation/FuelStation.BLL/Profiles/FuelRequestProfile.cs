using AutoMapper;
using FuelStation.Common.Models.DTOs.FuelRequest;
using FuelStation.DAL.Entities;

namespace FuelStation.BLL.Profiles;

public class FuelRequestProfile : Profile
{
    public FuelRequestProfile()
    {
        CreateMap<CreateFuelRequestDTO, FuelRequest>();
        CreateMap<FuelRequest, FuelRequestDTO>();
    }
}