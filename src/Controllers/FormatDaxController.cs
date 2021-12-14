﻿using Dax.Formatter;
using Dax.Formatter.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Sqlbi.Bravo.Infrastructure;
using Sqlbi.Bravo.Infrastructure.Extensions;
using Sqlbi.Bravo.Models;
using Sqlbi.Bravo.Services;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Threading.Tasks;

namespace Sqlbi.Bravo.Controllers
{
    [Route("api/[action]")]
    [ApiController]
    public class FormatDaxController : ControllerBase
    {
        private readonly IDaxFormatterClient _daxformatterClient;
        private readonly IPBIDesktopService _pbidesktopService;
        private readonly IPBICloudService _pbicloudService;

        public FormatDaxController(IDaxFormatterClient daxformatterClient, IPBIDesktopService pbidesktopService, IPBICloudService pbicloudService)
        {
            _daxformatterClient = daxformatterClient;
            _pbidesktopService = pbidesktopService;
            _pbicloudService = pbicloudService;
        }

        /// <summary>
        /// Format the provided DAX measures by using daxformatter.com service
        /// </summary>
        /// <response code="200">Status200OK - Success</response>
        [HttpPost]
        [ActionName("FormatDax")]
        [Consumes(MediaTypeNames.Application.Json)]
        [Produces(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FormatDaxResponse))]
        public async Task<IActionResult> FormatAsync(FormatDaxRequest request)
        {
            var daxformatterResponse = await CallDaxFormatter(request.Measures!, request.Options!);

            var response = new FormatDaxResponse();

            foreach (var (daxformatterMeasure, index) in daxformatterResponse.WithIndex())
            {
                var requestedMeasure = request.Measures!.ElementAt(index);
                var formattedMeasure = new FormattedMeasure
                {
                    ETag = requestedMeasure.ETag,
                    Name = requestedMeasure.Name,
                    TableName = requestedMeasure.TableName,
                    Expression = daxformatterMeasure.Formatted?.Remove(0, $"[{ requestedMeasure.Name }] :=".Length)?.TrimStart('\r', '\n', ' ')?.TrimEnd('\r', '\n', ' '),
                    Errors = daxformatterMeasure.Errors?.Select((e) => new FormatterError
                    {
                        Line = e.Line,
                        Column = e.Column,
                        Message = e.Message
                    })
                };

                response.Add(formattedMeasure);
            }

            return Ok(response);
        }

        /// <summary>
        /// Update a local Power BI report updating the formatted measures
        /// Parameters: local window id?, a list of pair of properties/values to change?
        /// </summary>
        /// <response code="200">Status200OK - Success</response>
        /// <response code="404">Status404NotFound - PBIDesktop report not found</response>
        [HttpPost]
        [ActionName("UpdateReport")]
        [Consumes(MediaTypeNames.Application.Json)]
        public IActionResult ApplyFormatAsync(ApplyFormatRequest request)
        {
            try
            {
                _pbidesktopService.Update(request.Report!, request.Measures!);
            }
            catch (BravoPBIDesktopReportNotFoundException ex)
            {
                return NotFound(ex.Message);
            }

            return Ok();
        }

        private async Task<IReadOnlyList<DaxFormatterResponse>> CallDaxFormatter(IEnumerable<TabularMeasure> measures, FormatDaxOptions options)
        {
            var request = new DaxFormatterMultipleRequest
            {
                CallerApp = AppConstants.ApplicationName,
                CallerVersion = AppConstants.ApplicationFileVersion,
                MaxLineLength = options.LineStyle,
                SkipSpaceAfterFunctionName = options.SpacingStyle,
            };

            // TODO : set DaxFormatterRequest.ListSeparator nullable
            request.ListSeparator = options.ListSeparator.GetValueOrDefault(request.ListSeparator);
            // TODO : set DaxFormatterRequest.DecimalSeparator nullable
            request.DecimalSeparator = options.DecimalSeparator.GetValueOrDefault(request.DecimalSeparator);

            foreach (var measure in measures)
                request.Dax.Add($"[{ measure.Name }] := { measure.Expression }");

            var response = await _daxformatterClient.FormatAsync(request).ConfigureAwait(false);
            return response;
        }
    }
}
