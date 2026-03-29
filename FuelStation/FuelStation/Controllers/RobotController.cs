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

    [HttpPut]
    public async Task<IActionResult> Update([FromQuery] Guid robotId, UpdateRobotDTO dto)
    {
        var result = await _robotService.UpdateRobotAsync(robotId, dto);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(Guid robotId)
    {
        var result = await _robotService.DeleteRobotAsync(robotId);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _robotService.GetAllRobotsAsync();
        return Ok(result);
    }

    [HttpGet("route")]
    public async Task<IActionResult> GetRoute(Guid robotId)
    {
        var result = await _robotService.GetRobotRouteAsync(robotId);
        return Ok(result);
    }

    [HttpPut("arrived")]
    public async Task<IActionResult> Arrived([FromQuery] Guid robotId)
    {
        await _robotService.ArrivedAsync(robotId);
        return Ok();
    }
}