using FuelStation.Common.Enums;

namespace FuelStation.Common.Models.DTOs;

public class ErrorDTO
{
    public ErrorDTO(ErrorCode errorCode, string message)
    {
        Message = message;
        ErrorCode = errorCode;
    }

    public ErrorCode ErrorCode { get; }

    public string Message { get; }
}