using FuelStation.ActionFilters;
using FuelStation.BLL.Profiles;
using FuelStation.BLL.Services;
using FuelStation.BLL.Services.Auth;
using FuelStation.BLL.Services.Interfaces;
using FuelStation.BLL.Services.Interfaces.Auth;
using FuelStation.Common.Models.Configs;
using FuelStation.DAL.Contexts;
using FuelStation.DAL.Entities;
using FuelStation.DAL.Repositories;
using FuelStation.DAL.Repositories.Interfaces;
using FuelStation.Extensions;
using FuelStation.Hangfire.Abstractions;
using FuelStation.Hangfire.Extensions;
using FuelStation.Hangfire.Services;
using FuelStation.Seeding.Extentions;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configs
var jwtConfig = new JwtConfig();
var hangfireConfig = new HangfireConfig();
builder.Services.AddConfigs(builder.Configuration, opt => opt
    .AddConfig<JwtConfig>(out jwtConfig)
    .AddConfig<HangfireConfig>(out hangfireConfig));

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .EnableSensitiveDataLogging()
           .EnableDetailedErrors());

// Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IFuelRequestService, FuelRequestService>();
builder.Services.AddScoped<IProcessFuelRequestService, ProcessFuelRequestService>();

// Identity & Auth
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddTokenProvider<DataProtectorTokenProvider<User>>(TokenOptions.DefaultProvider);

var tokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.Secret)),
    ValidIssuer = jwtConfig.Issuer,
    ValidAudience = jwtConfig.Audience,
    ClockSkew = jwtConfig.ClockSkew
};
builder.Services.AddSingleton(tokenValidationParameters);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.TokenValidationParameters = tokenValidationParameters;
});

// Hangfire
builder.Services.AddHangfire(cfg =>
    cfg.UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IHangfireService, HangfireService>();


// Utility
builder.Services.AddCors();
builder.Services.AddSeeding();

// AutoMapper
builder.Services.AddAutoMapper(typeof(UserProfile));

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Standard Authorization header using the Bearer scheme. Example: \"bearer {token}\"",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    c.MapType<TimeSpan>(() => new OpenApiSchema
    {
        Type = "string",
        Example = new Microsoft.OpenApi.Any.OpenApiString("00:00:00")
    });
});

// Controllers
builder.Services.AddControllers(opt => opt.Filters.Add<CustomExceptionFilterAttribute>());

var app = builder.Build();

app.SetupHangfire(hangfireConfig);

// Migrate DB
app.MigrateDatabase();

// Middleware
app.UseHttpsRedirection();

app.UseCors(x => x.AllowAnyHeader()
                  .AllowAnyOrigin()
                  .AllowAnyMethod());

await app.ApplySeedingAsync();

app.UseAuthentication();
app.UseAuthorization();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseHangfireDashboard("/hangfire");

// Map Controllers
app.MapControllers();

// Run app
app.Run();