using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Models.DTOs.Car;
using FuelStation.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace FuelStation.Controllers;

[ApiController]
[Route("api/car")]
public class CarController : ControllerBase
{
    private readonly ICarService _carService;

    public CarController(ICarService carService)
    {
        _carService = carService;
    }

    [HttpPost]
    public async Task<IActionResult> Add(CreateCarDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _carService.AddCarAsync(userId, dto);

        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetForUser()
    {
        var userId = HttpContext.GetUserId();
        var result = await _carService.GetUserCarsAsync(userId);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Guid carId, UpdateCarDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _carService.UpdateCarAsync(userId, carId, dto);

        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] Guid carId)
    {
        var userId = HttpContext.GetUserId();
        var result = await _carService.DeleteCarAsync(userId, carId);

        return result ? NoContent() : BadRequest();
    }
}