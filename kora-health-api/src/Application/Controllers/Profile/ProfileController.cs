using AutoMapper;
using KoraHealth.Application.Authentication;
using KoraHealth.Application.DTOs.Profile.Request;
using KoraHealth.Application.DTOs.Profile.Response;
using KoraHealth.Domain.Contracts.Services.Profile;
using KoraHealth.Domain.LocalDay;
using KoraHealth.Domain.Models.Profile;
using Microsoft.AspNetCore.Mvc;

namespace KoraHealth.Application.Controllers.Profile;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private const int CurrentUserId = FixedTestUser.Id;
    private readonly IProfileService _profileService;
    private readonly IMapper _mapper;

    public ProfileController(IProfileService profileService, IMapper mapper)
    {
        _profileService = profileService;
        _mapper = mapper;
    }

    [HttpGet("time-zone")]
    public async Task<ActionResult<TimeZoneRs>> GetTimeZone()
    {
        return Ok(_mapper.Map<TimeZoneRs>(await _profileService.GetTimeZoneAsync(CurrentUserId)));
    }

    [HttpPut("time-zone")]
    public async Task<ActionResult<TimeZoneRs>> SetTimeZone(SetTimeZoneRq rq)
    {
        if (!rq.IsValid()) return BadRequest("TimeZoneId must not be empty, padded with spaces or longer than 64 characters.");

        var timeZone = await _profileService.SetTimeZoneAsync(CurrentUserId, _mapper.Map<UserTimeZone>(rq));

        return timeZone is null
            ? BadRequest($"TimeZoneId must be a valid IANA time zone identifier, such as {TimeZoneDefaults.DefaultTimeZoneId}.")
            : Ok(_mapper.Map<TimeZoneRs>(timeZone));
    }
}
