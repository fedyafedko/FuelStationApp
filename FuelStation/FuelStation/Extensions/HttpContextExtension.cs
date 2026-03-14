using FuelStation.Common.Exceptions;

namespace FuelStation.Extensions;

public static class HttpContextExtension
{
    public static Guid GetUserId(this HttpContext context)
    {
        var claim = context.User.Claims.FirstOrDefault(c => c.Type == "id");

        if (claim == null)
            throw new AuthException("Unauthorized");

        return new Guid(claim.Value);
    }
}
