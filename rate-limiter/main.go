package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/go-redis/redis/v8"
    "github.com/joho/godotenv"
)

var ctx = context.Background()
var redisClient *redis.Client

type RateLimiter struct {
    maxRequests   int
    timeWindow    time.Duration
    blockDuration time.Duration
}

func NewRateLimiter(maxRequests int, timeWindow time.Duration, blockDuration time.Duration) *RateLimiter {
    return &RateLimiter{
        maxRequests:   maxRequests,
        timeWindow:    timeWindow,
        blockDuration: blockDuration,
    }
}

func (rl *RateLimiter) isBlocked(key string) bool {
    blocked, err := redisClient.Get(ctx, "blocked:"+key).Result()
    if err == nil && blocked == "1" {
        return true
    }
    return false
}

func (rl *RateLimiter) allowRequest(key string) bool {
    if rl.isBlocked(key) {
        return false
    }
    
    now := time.Now().Unix()
    windowStart := now - int64(rl.timeWindow.Seconds())
    
    // Remove old entries
    redisClient.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart, 10))
    
    // Count requests in current window
    count, _ := redisClient.ZCard(ctx, key).Result()
    
    if int(count) >= rl.maxRequests {
        // Block the key
        redisClient.Set(ctx, "blocked:"+key, "1", rl.blockDuration)
        return false
    }
    
    // Add current request
    redisClient.ZAdd(ctx, key, &redis.Z{
        Score:  float64(now),
        Member: now,
    })
    redisClient.Expire(ctx, key, rl.timeWindow)
    
    return true
}

func rateLimitMiddleware(next http.HandlerFunc) http.HandlerFunc {
    maxReqs, _ := strconv.Atoi(os.Getenv("MAX_REQUESTS_PER_SECOND"))
    if maxReqs == 0 {
        maxReqs = 100
    }
    
    rl := NewRateLimiter(
        maxReqs,
        time.Second,
        time.Duration(maxReqs)*time.Second,
    )
    
    return func(w http.ResponseWriter, r *http.Request) {
        clientIP := r.RemoteAddr
        apiKey := r.Header.Get("API_KEY")
        
        var key string
        if apiKey != "" {
            key = "token:" + apiKey
        } else {
            key = "ip:" + clientIP
        }
        
        if !rl.allowRequest(key) {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusTooManyRequests)
            json.NewEncoder(w).Encode(map[string]interface{}{
                "error": "too many requests",
                "message": "you have reached the maximum number of requests allowed within a certain time frame",
                "retry_after": rl.blockDuration.Seconds(),
            })
            return
        }
        
        next.ServeHTTP(w, r)
    }
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
    // Forward request to the appropriate service
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "status": "request allowed",
        "path": r.URL.Path,
    })
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
        "service": "rate-limiter",
    })
}

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }
    
    // Initialize Redis
    redisAddr := os.Getenv("REDIS_ADDR")
    if redisAddr == "" {
        redisAddr = "localhost:6379"
    }
    
    redisClient = redis.NewClient(&redis.Options{
        Addr: redisAddr,
        Password: os.Getenv("REDIS_PASSWORD"),
        DB: 0,
    })
    
    // Test Redis connection
    if err := redisClient.Ping(ctx).Err(); err != nil {
        log.Fatal("Failed to connect to Redis:", err)
    }
    log.Println("Connected to Redis")
    
    // Setup routes
    http.HandleFunc("/health", healthCheck)
    http.HandleFunc("/", rateLimitMiddleware(proxyHandler))
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8081"
    }
    
    log.Printf("Rate Limiter starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}