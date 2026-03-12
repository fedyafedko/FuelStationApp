using System.Security.Cryptography;

namespace FuelStation.BLL.Utility;

public static class TokenGenerator
{
    private const int DefaultBytesCount = 32;

    public static int GenerateNumericCode(int digitsCount)
    {
        var randomBytes = GetRandomBytes(DefaultBytesCount);
        var code = 0;
        for (int i = 0; i < digitsCount; i++)
        {
            code += randomBytes[i] % 10 * (int)Math.Pow(10, i);
        }

        return ValidateNumericCode(code, digitsCount);
    }

    public static string GenerateToken(int bytesCount = DefaultBytesCount)
    {
        return Convert.ToBase64String(GetRandomBytes(bytesCount));
    }

    private static byte[] GetRandomBytes(int bytesCount)
    {
        var randomBytes = new byte[bytesCount];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return randomBytes;
    }

    private static int ValidateNumericCode(int code, int digitsCount)
    {
        var codeLength = code.ToString().Length;
        if (codeLength == digitsCount)
            return code;

        var codeString = code + new string('0', digitsCount - codeLength);
        return int.Parse(codeString);
    }
}
