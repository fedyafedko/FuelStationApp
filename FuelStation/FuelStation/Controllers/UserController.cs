using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Models.DTOs.User;
using FuelStation.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace FuelStation.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUser()
    {
        var userId = HttpContext.GetUserId();
        var result = await _userService.GetUserAsync(userId);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateUserDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _userService.UpdateUserAsync(userId, dto);

        return Ok(result);
    }
}