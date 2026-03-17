namespace FuelStation.Common.Enums;

public enum RequestStatus
{
    Pending = 0,
    Completed = 1,
    InProgress = 2,
    Cancelled = 3,
    RobotUnavailable = 4,
    WaitingForPayment = 5,
    StartFueling = 6,
    SendCar = 7
}