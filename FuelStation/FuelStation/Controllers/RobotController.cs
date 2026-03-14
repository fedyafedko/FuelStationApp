using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Models.DTOs.Robot;
using Microsoft.AspNetCore.Mvc;

namespace FuelStation.Controllers;

[ApiController]
[Route("api/robot")]
public class RobotController : ControllerBase
{
    private readonly IRobotService _robotService;

    public RobotController(IRobotService robotService)
    {
        _robotService = robotService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateRobotDTO dto)
    {
        var result = await _robotService.CreateRobotAsync(dto);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _robotService.GetAllRobotsAsync();
        return Ok(result);
    }
}