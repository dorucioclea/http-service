using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JwtAuthApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JwtAuthApi.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthSettings settings;

        public AuthController(IOptions<AuthSettings> settings)
        {
            this.settings = settings.Value;
        }
        // GET api/values
        [HttpPost, Route("login")]
        public IActionResult Login([FromBody] LoginModel user)
        {
            var config = settings;

            if (user == null)
            {
                return BadRequest("Invalid client request");
            }

            if (user.UserName == "user" && user.Password == "pass")
            {
                var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.SecretKey));
                var signinCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

                var tokenOptions = new JwtSecurityToken(
                    issuer: config.Issuer,
                    audience: config.Audience,
                    claims: new List<Claim>()
                    {
                        new Claim(ClaimTypes.Role, "Manager")
                    },
                    expires : DateTime.Now.AddMinutes(config.ExpirationTimeInMinutes),
                    signingCredentials : signinCredentials
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(tokenOptions);
                return Ok(new { Token = tokenString });
            }
            else
            {
                return Unauthorized();
            }
        }
    }

    public class LoginModel
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}