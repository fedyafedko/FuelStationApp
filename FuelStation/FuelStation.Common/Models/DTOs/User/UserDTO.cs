using FuelStation.Common.Models.DTOs.Car;

namespace FuelStation.Common.Models.DTOs.User;

public class UserDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public List<CarDTO> Cars { get; set; }
}