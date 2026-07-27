using AutoMapper;
using KoraHealth.Application.Authentication;
using KoraHealth.Application.DTOs.WaterTracking.Request;
using KoraHealth.Application.DTOs.WaterTracking.Response;
using KoraHealth.Domain.Contracts.Services.WaterTracking;
using KoraHealth.Domain.Models.WaterTracking;
using Microsoft.AspNetCore.Mvc;

namespace KoraHealth.Application.Controllers.WaterTracking;

[ApiController]
[Route("api/water-tracking")]
public class WaterTrackingController : ControllerBase
{
    private const int CurrentUserId = FixedTestUser.Id;
    private readonly IWaterTrackingService _waterTrakingService;
    private readonly IMapper _mapper;

    public WaterTrackingController(IWaterTrackingService waterTrakingService, IMapper mapper)
    {
        _waterTrakingService = waterTrakingService;
        _mapper = mapper;
    }

    [HttpGet("goal")]
    public async Task<ActionResult<WaterGoalRs>> GetGoal()
    {
        var goal = await _waterTrakingService.GetGoalAsync(CurrentUserId);

        return goal is null ? NotFound() : Ok(_mapper.Map<WaterGoalRs>(goal));
    }

    [HttpPut("goal")]
    public async Task<ActionResult<WaterGoalRs>> SetGoal(SetWaterGoalRq rq)
    {
        if (!rq.IsValid()) return BadRequest("DailyGoalMl must be greater than zero.");

        return Ok(_mapper.Map<WaterGoalRs>(await _waterTrakingService.SetGoalAsync(CurrentUserId, _mapper.Map<WaterGoal>(rq))));
    }

    [HttpPost("entries")]
    public async Task<ActionResult<WaterEntryRs>> LogEntry(LogWaterRq rq)
    {
        if (!rq.IsValid()) return BadRequest("AmountMl must be greater than zero.");

        return Ok(_mapper.Map<WaterEntryRs>(await _waterTrakingService.LogEntryAsync(CurrentUserId, _mapper.Map<WaterEntry>(rq))));
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<WaterHistoryDayRs>>> GetHistory([FromQuery] int days = 30)
    {
        return Ok(_mapper.Map<List<WaterHistoryDayRs>>(await _waterTrakingService.GetHistoryAsync(CurrentUserId, days)));
    }
}
