using System.Text.Json.Serialization;

namespace FuelStation.Common.Models.Routes;

public class OsrmResponse
{
    [JsonPropertyName("code")]
    public string Code { get; set; }

    [JsonPropertyName("routes")]
    public List<Route> Routes { get; set; }

    [JsonPropertyName("waypoints")]
    public List<Waypoint> Waypoints { get; set; }
}

public class Route
{
    [JsonPropertyName("geometry")]
    public string Geometry { get; set; }

    [JsonPropertyName("legs")]
    public List<Leg> Legs { get; set; }

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("weight_name")]
    public string WeightName { get; set; }

    [JsonPropertyName("weight")]
    public double Weight { get; set; }
}

public class Leg
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("summary")]
    public string Summary { get; set; }

    [JsonPropertyName("weight")]
    public double Weight { get; set; }
}

public class Waypoint
{
    [JsonPropertyName("hint")]
    public string Hint { get; set; }

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("location")]
    public List<double> Location { get; set; } // [lng, lat]
}