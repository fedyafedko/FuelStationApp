using FuelStation.Common.Enums;

namespace FuelStation.Common.Exceptions.Base;

public abstract class CustomExceptionBase : ApplicationException
{
    protected CustomExceptionBase(string message, Exception? innerException = null)
        : base(message, innerException) { }

    public abstract ErrorCode ErrorCode { get; }
}