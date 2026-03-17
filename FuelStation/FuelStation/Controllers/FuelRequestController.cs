using FuelStation.BLL.Services.Interfaces;
using FuelStation.Common.Models.DTOs.FuelRequest;
using FuelStation.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace FuelStation.Controllers;

[ApiController]
[Route("api/fuel-request")]
public class FuelRequestController : ControllerBase
{
    private readonly IFuelRequestService _fuelRequestService;

    public FuelRequestController(IFuelRequestService fuelRequestService)
    {
        _fuelRequestService = fuelRequestService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest(CreateFuelRequestDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _fuelRequestService.CreateAsync(userId, dto);

        return Ok(result);
    }

    [HttpPut("confirm")]
    public async Task<IActionResult> Confirm(Guid requestId, string code)
    {
        var userId = HttpContext.GetUserId();
        await _fuelRequestService.ConfirmRequestAsync(userId, requestId, code);

        return Ok();
    }

    [HttpPut("paid")]
    public async Task<IActionResult> Paid(Guid requestId)
    {
        var userId = HttpContext.GetUserId();
        await _fuelRequestService.PaidAsync(userId, requestId);

        return Ok();
    }

    [HttpPut("send-car")]
    public async Task<IActionResult> SendCar(Guid requestId)
    {
        var userId = HttpContext.GetUserId();
        await _fuelRequestService.SendCarToRequestAsync(userId, requestId);

        return Ok();
    }

    [HttpPut("complete")]
    public async Task<IActionResult> Complete(Guid requestId)
    {
        var userId = HttpContext.GetUserId();
        await _fuelRequestService.CompleteRequestAsync(userId, requestId);

        return Ok();
    }


    [HttpGet]
    public async Task<IActionResult> GetById(Guid requestId)
    {
        var result = await _fuelRequestService.GetByIdAsync(requestId);

        return Ok(result);
    }
}