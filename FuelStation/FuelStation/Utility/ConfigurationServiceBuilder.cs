using FuelStation.Common.Models.Configs.Base;
using FuelStation.Extensions;
using System.Linq.Expressions;
using System.Reflection;

namespace FuelStation.Utility;

public class ConfigurationServiceBuilder
{
    private readonly IServiceCollection _services;
    private readonly IConfiguration _configuration;

    public ConfigurationServiceBuilder(IServiceCollection services, IConfiguration configuration)
    {
        _services = services;
        _configuration = configuration;
    }

    public ConfigurationServiceBuilder AddConfig<T>(
        string? sectionName = null,
        params Expression<Func<T, string>>[] pathProperties)
        where T : ConfigBase, new()
    {
        CreateAndAddConfig(sectionName, pathProperties);
        return this;
    }

    public ConfigurationServiceBuilder AddConfig<T>(out T config, string? sectionName = null, params Expression<Func<T, string>>[] pathProperties)
        where T : ConfigBase, new()
    {
        config = CreateAndAddConfig(sectionName, pathProperties);
        return this;
    }

    private T CreateAndAddConfig<T>(string? sectionName, params Expression<Func<T, string>>[] pathProperties)
        where T : ConfigBase, new()
    {
        var config = new T();

        var configSection = _configuration.GetSection(sectionName ?? typeof(T).Name);

        if (!configSection.Exists())
            configSection = _configuration.GetSection(typeof(T).Name.Replace("Config", string.Empty));

        if (!configSection.Exists())
            throw new ArgumentException($"Failed to find specified config section. {sectionName}");

        configSection.Bind(config);

        if (pathProperties.Length > 0)
        {
            foreach (var propertyExpression in pathProperties)
            {
                if ((propertyExpression.Body as MemberExpression)?.Member is not PropertyInfo propertyInfo)
                    throw new ArgumentException("Invalid property expression.");

                var value = (string)propertyInfo.GetValue(config)!;
                propertyInfo.SetValue(config, value.ToAbsolutePath());
            }
        }

        _services.AddSingleton(config);

        return config;
    }
}
