using AutoMapper;
using KoraHealth.Application.Authentication;
using KoraHealth.Application.DTOs.Request;
using KoraHealth.Application.DTOs.Response;
using KoraHealth.Domain.Contracts.Services;
using KoraHealth.Domain.Entities.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace KoraHealth.Application.Controllers;

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
        if (rq.DailyGoalMl <= 0) return BadRequest("DailyGoalMl must be greater than zero.");

        var domainGoal = _mapper.Map<WaterGoal>(rq);
        var goal = await _waterTrakingService.SetGoalAsync(CurrentUserId, domainGoal);

        return Ok(_mapper.Map<WaterGoalRs>(goal));
    }

    [HttpPost("entries")]
    public async Task<ActionResult<WaterEntryRs>> LogEntry(LogWaterRq rq)
    {
        if (rq.AmountMl <= 0) return BadRequest("AmountMl must be greater than zero.");

        var domainEntry = _mapper.Map<WaterEntry>(rq);
        var entry = await _waterTrakingService.LogEntryAsync(CurrentUserId, domainEntry);

        return Ok(_mapper.Map<WaterEntryRs>(entry));
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<WaterHistoryDayRs>>> GetHistory([FromQuery] int days = 30)
    {
        var history = await _waterTrakingService.GetHistoryAsync(CurrentUserId, days);

        return Ok(_mapper.Map<List<WaterHistoryDayRs>>(history));
    }
}
