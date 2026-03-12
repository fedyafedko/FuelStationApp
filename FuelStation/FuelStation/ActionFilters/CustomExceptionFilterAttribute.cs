using FuelStation.Common.Enums;
using FuelStation.Common.Exceptions.Base;
using FuelStation.Common.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FuelStation.ActionFilters;

public class CustomExceptionFilterAttribute : ExceptionFilterAttribute
{
    private readonly IWebHostEnvironment _environment;

    public CustomExceptionFilterAttribute(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public override void OnException(ExceptionContext context)
    {
        var actionResult = context.Exception switch
        {
            CustomExceptionBase ex => new BadRequestObjectResult(new ErrorDTO(ex.ErrorCode, ex.Message)),
            _ => new ObjectResult(
                _environment.IsDevelopment()
                    ? new { ErrorCode = ErrorCode.Unknown, context.Exception.Message, context.Exception.StackTrace }
                    : new ErrorDTO(ErrorCode.Unknown, "Unknown server error"))
            { StatusCode = 500 }
        };
        context.ExceptionHandled = true;
        context.Result = actionResult;
    }
}

