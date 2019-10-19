namespace JwtAuthApi.Models {
    public class AuthSettings {
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public int ExpirationTimeInMinutes { get; set; }
        public string SecretKey { get; set; }
    }
}