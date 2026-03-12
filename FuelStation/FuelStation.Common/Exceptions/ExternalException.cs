using FuelStation.Common.Enums;
using FuelStation.Common.Exceptions.Base;

namespace FuelStation.Common.Exceptions;

public class ExternalException : CustomExceptionBase
{
    public ExternalException(string message, Exception? innerException = null)
        : base(message, innerException) { }

    public override ErrorCode ErrorCode => ErrorCode.ExternalError;
}