using AutoMapper;
using FuelStation.Common.Models.DTOs.Route;
using FuelStation.Common.Models.Routes;

namespace FuelStation.BLL.Profiles;

public class RouteProfile : Profile
{
    public RouteProfile()
    {
        CreateMap<OsrmResponse, DAL.Entities.Route>()
            .ForMember(dest => dest.StartLat, opt => opt.MapFrom(src => src.Waypoints[0].Location[1]))
            .ForMember(dest => dest.StartLng, opt => opt.MapFrom(src => src.Waypoints[0].Location[0]))
            .ForMember(dest => dest.EndLat, opt => opt.MapFrom(src => src.Waypoints[1].Location[1]))
            .ForMember(dest => dest.EndLng, opt => opt.MapFrom(src => src.Waypoints[1].Location[0]))
            .ForMember(dest => dest.Distance, opt => opt.MapFrom(src => src.Routes[0].Distance))
            .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Routes[0].Duration))
            .ForMember(dest => dest.Geometry, opt => opt.MapFrom(src => src.Routes[0].Geometry))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

        CreateMap<DAL.Entities.Route, RouteDTO>();
    }
}