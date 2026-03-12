using AutoMapper;
using FuelStation.Common.Models.DTOs.Auth;
using FuelStation.Common.Models.DTOs.User;
using FuelStation.DAL.Entities;

namespace FuelStation.BLL.Profiles;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<SignUpDTO, User>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email));

        CreateMap<UpdateUserDTO, User>();

        CreateMap<User, UserDTO>();
    }
}