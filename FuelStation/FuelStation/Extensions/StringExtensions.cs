namespace FuelStation.Extensions;

public static class StringExtensions
{
    public static string ToAbsolutePath(this string source)
    {
        var path = Directory.GetCurrentDirectory();
#if DEBUG
        const string solutionName = "FuelStation";
        var solutionPath = path[..path.LastIndexOf(solutionName, StringComparison.Ordinal)];
        return $"{solutionPath}{source}";
#else
        return Path.Combine(path, source);
#endif
    }
}

