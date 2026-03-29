using AutoMapper;
using FuelStation.Common.Models.DTOs.Robot;
using FuelStation.DAL.Entities;

namespace FuelStation.BLL.Profiles;

public class RobotProfile : Profile
{
    public RobotProfile()
    {
        CreateMap<Robot, RobotDTO>();
        CreateMap<CreateRobotDTO, Robot>();
        CreateMap<UpdateRobotDTO, Robot>();
    }
}